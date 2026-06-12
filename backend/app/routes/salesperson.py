from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.salesperson import Salesperson
from app.schemas.salesperson import SalespersonCreate, SalespersonOut

router = APIRouter(prefix="/salesperson", tags=["Salesperson"])

@router.post("/", response_model=SalespersonOut)
def create_salesperson(data: SalespersonCreate, db: Session = Depends(get_db)):
    sp = Salesperson(**data.dict())
    db.add(sp)
    db.commit()
    db.refresh(sp)
    return sp


@router.get("/", response_model=list[SalespersonOut])
def get_salespersons(db: Session = Depends(get_db)):
    return db.query(Salesperson).all()