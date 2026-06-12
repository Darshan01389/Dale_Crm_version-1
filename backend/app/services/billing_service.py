from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List

from app.models.billing import SubscriptionPlan, CompanySubscription, Invoice
from app.schemas.billing import CompanySubscriptionBase

def get_or_create_default_plans(db: Session) -> List[SubscriptionPlan]:
    plans = db.query(SubscriptionPlan).all()
    if not plans:
        basic = SubscriptionPlan(name="Basic", base_price=99.0, max_requests_per_minute=10, has_voice_transcription=False, has_advanced_lead_sources=False)
        pro = SubscriptionPlan(name="Pro", base_price=299.0, max_requests_per_minute=20, has_voice_transcription=True, has_advanced_lead_sources=True)
        custom = SubscriptionPlan(name="Custom", base_price=0.0, max_requests_per_minute=0, has_voice_transcription=False, has_advanced_lead_sources=False)
        db.add_all([basic, pro, custom])
        db.commit()
        return [basic, pro, custom]
    return plans

def subscribe_company(db: Session, company_id: int, sub_data: CompanySubscriptionBase) -> CompanySubscription:
    sub = db.query(CompanySubscription).filter(CompanySubscription.company_id == company_id).first()
    if not sub:
        sub = CompanySubscription(company_id=company_id)
        db.add(sub)

    sub.plan_id = sub_data.plan_id
    sub.custom_price = sub_data.custom_price
    sub.custom_requests_per_minute = sub_data.custom_requests_per_minute
    sub.custom_voice = sub_data.custom_voice
    sub.custom_lead_sources = sub_data.custom_lead_sources

    # Generate initial invoice
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == sub.plan_id).first()
    amount: float = sub.custom_price if sub.custom_price is not None else (plan.base_price if plan else 0.0)

    invoice = Invoice(company_id=company_id, subscription_id=sub.id, amount_due=amount, status="paid", paid_date=datetime.utcnow())
    db.add(invoice)
    db.commit()
    db.refresh(sub)
    return sub

def subscribe_company_gateway(db: Session, company_id: int, sub_data: CompanySubscriptionBase, gateway: str) -> dict:
    import uuid
    from app.core.config import settings

    sub = db.query(CompanySubscription).filter(CompanySubscription.company_id == company_id).first()
    if not sub:
        sub = CompanySubscription(company_id=company_id)
        db.add(sub)

    sub.plan_id = sub_data.plan_id
    sub.custom_price = sub_data.custom_price
    sub.custom_requests_per_minute = sub_data.custom_requests_per_minute
    sub.custom_voice = sub_data.custom_voice
    sub.custom_lead_sources = sub_data.custom_lead_sources
    sub.status = "pending_payment"

    db.add(sub)
    db.flush() # get sub.id

    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == sub.plan_id).first()
    amount: float = sub.custom_price if sub.custom_price is not None else (plan.base_price if plan else 0.0)

    # Generate pending invoice
    invoice = Invoice(
        company_id=company_id,
        subscription_id=sub.id,
        amount_due=amount,
        status="pending",
        gateway=gateway
    )
    db.add(invoice)
    db.flush() # get invoice.id

    response_data = {
        "subscription_id": sub.id,
        "invoice_id": invoice.id,
        "gateway": gateway,
        "amount": amount
    }

    if gateway == "stripe":
        if settings.STRIPE_SECRET_KEY:
            import stripe
            stripe.api_key = settings.STRIPE_SECRET_KEY
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': f"VoiceIQ {plan.name} Subscription",
                        },
                        'unit_amount': int(amount * 100),
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=f'{settings.FRONTEND_URL}/billing?status=success',
                cancel_url=f'{settings.FRONTEND_URL}/billing?status=cancel',
                metadata={
                    'company_id': str(company_id),
                    'invoice_id': str(invoice.id)
                }
            )
            invoice.gateway_order_id = session.id
            response_data["stripe_session_id"] = session.id
            response_data["stripe_checkout_url"] = session.url
        else:
            # Sandbox/mock mode
            mock_session_id = f"cs_mock_{uuid.uuid4().hex[:12]}"
            invoice.gateway_order_id = mock_session_id
            response_data["stripe_session_id"] = mock_session_id
            response_data["stripe_checkout_url"] = f"{settings.FRONTEND_URL}/billing?status=mock_stripe&session_id={mock_session_id}"
            
    elif gateway == "razorpay":
        # 1 USD = 85 INR exchange rate for UPI/India payment presentation
        amount_in_inr = int(amount * 85)
        amount_in_paise = amount_in_inr * 100

        if settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
            import razorpay
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            order = client.order.create({
                "amount": amount_in_paise,
                "currency": "INR",
                "receipt": str(invoice.id),
                "payment_capture": 1
            })
            invoice.gateway_order_id = order['id']
            response_data["razorpay_order_id"] = order['id']
            response_data["razorpay_key_id"] = settings.RAZORPAY_KEY_ID
        else:
            # Sandbox/mock mode
            mock_order_id = f"order_mock_{uuid.uuid4().hex[:12]}"
            invoice.gateway_order_id = mock_order_id
            response_data["razorpay_order_id"] = mock_order_id
            response_data["razorpay_key_id"] = "rzp_test_mock_123"

    db.commit()
    return response_data

def process_successful_payment(db: Session, gateway: str, gateway_order_id: str, payment_id: str) -> bool:
    invoice = db.query(Invoice).filter(
        Invoice.gateway == gateway,
        Invoice.gateway_order_id == gateway_order_id
    ).first()

    if not invoice:
        print(f"Payment verification failed: Invoice not found for gateway={gateway}, order_id={gateway_order_id}")
        return False

    if invoice.status == "paid":
        print(f"Payment already processed for invoice {invoice.id}")
        return True

    invoice.status = "paid"
    invoice.paid_date = datetime.utcnow()

    # Activate associated subscription
    sub = db.query(CompanySubscription).filter(CompanySubscription.id == invoice.subscription_id).first()
    if sub:
        sub.status = "active"
        sub.current_period_start = datetime.utcnow()
        sub.current_period_end = datetime.utcnow() + timedelta(days=30)
        sub.ai_requests_used = 0 # reset usage

    db.commit()
    print(f"Payment succeeded! Invoice {invoice.id} marked as PAID. Subscription {sub.id if sub else 'None'} activated.")
    return True

def increment_ai_usage(db: Session, company_id: int) -> None:
    if not company_id:
        return
    sub = db.query(CompanySubscription).filter(CompanySubscription.company_id == company_id).first()
    if sub:
        sub.ai_requests_used += 1
        db.commit()

def generate_invoice(db: Session, company_id: int) -> Optional[Invoice]:
    sub = db.query(CompanySubscription).filter(CompanySubscription.company_id == company_id).first()
    if not sub:
        return None

    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == sub.plan_id).first()
    base_price: float = sub.custom_price if sub.custom_price is not None else (plan.base_price if plan else 0.0)

    # Overage: $0.05 per request over 10,000 per month
    limit = 10000
    overage_cost: float = 0.0
    if sub.ai_requests_used > limit:
        overage_cost = (sub.ai_requests_used - limit) * 0.05

    total = base_price + overage_cost

    inv = Invoice(
        company_id=company_id,
        subscription_id=sub.id,
        amount_due=total,
        status="pending"
    )
    db.add(inv)

    # Reset usage for next period
    sub.ai_requests_used = 0
    sub.current_period_start = datetime.utcnow()
    sub.current_period_end = datetime.utcnow() + timedelta(days=30)

    db.commit()
    db.refresh(inv)
    return inv


def compile_invoice_pdf(db: Session, invoice: Invoice) -> str:
    import os
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas
    except ImportError:
        # Fallback if ReportLab is not installed: create a text file pretending to be PDF or prompt installation
        pdf_dir = "uploads/invoices"
        os.makedirs(pdf_dir, exist_ok=True)
        txt_path = os.path.join(pdf_dir, f"invoice_{invoice.id}.pdf")
        with open(txt_path, "w") as f:
            f.write(f"DeaL CRM Invoice\nInvoice ID: {invoice.id}\nAmount: ${invoice.amount_due:.2f}\nStatus: {invoice.status}")
        return txt_path

    pdf_dir = "uploads/invoices"
    os.makedirs(pdf_dir, exist_ok=True)
    pdf_path = os.path.join(pdf_dir, f"invoice_{invoice.id}.pdf")
    
    # Get company info
    from app.models.company import Company
    company = db.query(Company).filter(Company.id == invoice.company_id).first()
    company_name = company.name if company else "Valued Customer"
    
    c = canvas.Canvas(pdf_path, pagesize=letter)
    width, height = letter
    
    # Header Header
    c.setFont("Helvetica-Bold", 20)
    c.drawString(50, height - 50, "DeaL CRM Invoice")
    
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 70, f"Invoice ID: {invoice.id}")
    c.drawString(50, height - 85, f"Billing Date: {invoice.billing_date.strftime('%B %d, %Y')}")
    c.drawString(50, height - 100, f"Payment Status: {invoice.status.upper()}")
    
    # Billed To
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 140, "Billed To:")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 155, company_name)
    
    # Divider
    c.line(50, height - 180, 550, height - 180)
    
    # Invoice Line Items
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 200, "Description")
    c.drawString(450, height - 200, "Amount")
    c.line(50, height - 205, 550, height - 205)
    
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 225, "DaleIQ AI-Powered CRM Subscription Fee")
    c.drawString(450, height - 225, f"${invoice.amount_due:.2f}")
    
    c.line(50, height - 240, 550, height - 240)
    
    # Total
    c.setFont("Helvetica-Bold", 12)
    c.drawString(350, height - 265, "Total Due:")
    c.drawString(450, height - 265, f"${invoice.amount_due:.2f}")
    
    # Footer
    c.setFont("Helvetica-Oblique", 9)
    c.drawString(50, 50, "Thank you for using DeaL CRM! For support contact billing@deal-crm.com")
    
    c.save()
    return pdf_path


