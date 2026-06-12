from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.company import Company
from app.schemas.company import CompanyCreate, CompanyOut

router = APIRouter(prefix="/company", tags=["Company"])

@router.post("/", response_model=CompanyOut)
def create_company(company: CompanyCreate, db: Session = Depends(get_db)):
    import random
    new_company = Company(**company.dict())
    new_company.join_code = str(random.randint(100000, 999999))
    db.add(new_company)
    db.commit()
    db.refresh(new_company)
    return new_company


@router.get("/", response_model=list[CompanyOut])
def get_companies(db: Session = Depends(get_db)):
    companies = db.query(Company).all()
    import random
    updated = False
    for c in companies:
        if not c.join_code:
            c.join_code = str(random.randint(100000, 999999))
            updated = True
    if updated:
        db.commit()
    return companies