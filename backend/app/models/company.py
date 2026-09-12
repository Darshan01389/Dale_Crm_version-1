from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    industry = Column(String)
    whatsapp_number = Column(String)
    size = Column(String, nullable=True)
    join_code = Column(String(10), nullable=True)

    leads = relationship("Lead", back_populates="linked_company")