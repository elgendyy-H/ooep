#!/usr/bin/env python3
"""
Train ML model for vulnerability classification.
Run from backend directory: python scripts/train_model.py
"""
import sys
import os
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.utils.config import settings
from app.models import Finding

def main():
    engine = create_engine(settings.DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    findings = session.query(Finding).filter(Finding.severity.isnot(None)).all()
    if not findings:
        print("No findings found in database. Using dummy data for training.")
        dummy_data = [
            ("SQL injection vulnerability", "critical"),
            ("Cross-site scripting", "high"),
            ("Missing security headers", "medium"),
            ("Server version disclosure", "low"),
            ("Information disclosure", "info")
        ]
        df = pd.DataFrame(dummy_data, columns=["text", "severity"])
    else:
        data = [(f"{f.title} {f.description}", f.severity) for f in findings]
        df = pd.DataFrame(data, columns=["text", "severity"])

    X = df["text"]
    y = df["severity"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    vectorizer = TfidfVectorizer(max_features=5000, stop_words='english')
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train_vec, y_train)

    y_pred = clf.predict(X_test_vec)
    print(classification_report(y_test, y_pred))

    model_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "models")
    os.makedirs(model_dir, exist_ok=True)
    joblib.dump(clf, os.path.join(model_dir, "classifier.pkl"))
    joblib.dump(vectorizer, os.path.join(model_dir, "vectorizer.pkl"))

    print(f"Model saved to {model_dir}/classifier.pkl")
    session.close()

if __name__ == "__main__":
    main()