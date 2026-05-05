from sqlalchemy import Column, Integer, String
from app.core.database import Base

class Salesperson(Base):
    __tablename__ = "salespersons"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String)