import uuid

from datetime import datetime



from sqlalchemy import Column, DateTime, Float, ForeignKey, String, Text

from sqlalchemy.dialects.postgresql import UUID

from sqlalchemy.orm import relationship



from app.core.database import Base





class VoiceRecording(Base):

    __tablename__ = "voice_recordings"



    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    owner_id = Column(

        UUID(as_uuid=True),

        ForeignKey("users.id", ondelete="CASCADE"),

        nullable=False,

        index=True,

    )

    lead_id = Column(

        UUID(as_uuid=True),

        ForeignKey("leads.id", ondelete="CASCADE"),

        nullable=True,

        index=True,

    )

    deal_id = Column(

        UUID(as_uuid=True),

        ForeignKey("deals.id", ondelete="CASCADE"),

        nullable=True,

        index=True,

    )



    # File information

    filename = Column(String(255), nullable=False)

    file_path = Column(String(500), nullable=False)  # Local path or S3 URL

    duration_seconds = Column(Float, nullable=True)

    file_size_bytes = Column(Float, nullable=True)



    # Transcription results

    transcript = Column(Text, nullable=True)

    language_code = Column(String(10), nullable=True)



    # Analysis results (Voice AI Intelligence)

    sentiment_label = Column(String(32), nullable=True)  # positive/neutral/negative

    sentiment_score = Column(Float, nullable=True)      # -1 to 1

    tone_analysis = Column(String(500), nullable=True) # e.g. "Excited", "Aggressive"

    buying_signals = Column(Text, nullable=True)        # JSON or text list of signals detected

    summary = Column(Text, nullable=True)               # AI-generated summary of the call



    # Timing

    occurred_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)



    # Relationships

    owner = relationship("User", backref="voice_recordings")

    lead = relationship("Lead", backref="voice_recordings")

    deal = relationship("Deal", backref="voice_recordings")

