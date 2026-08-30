"""Create initial admin user."""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import sync_engine
from app.deps import hash_password
from app.models import User


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    args = parser.parse_args()

    with Session(sync_engine) as session:
        existing = session.scalar(select(User).where(User.email == args.email))
        if existing:
            print(f"User {args.email} already exists (role={existing.role})")
            return

        user = User(
            email=args.email,
            password_hash=hash_password(args.password),
            role="admin",
        )
        session.add(user)
        session.commit()
        print(f"Created admin: {args.email}")


if __name__ == "__main__":
    main()
