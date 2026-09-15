"""Generate synthetic career dataset (clearly documented as SYNTHETIC).
Run: python scripts/generate_dataset.py --n 2000 --seed 42
"""
import argparse
import numpy as np
import pandas as pd
from pathlib import Path

ROLES = [
    "Data Analyst", "Data Scientist", "Machine Learning Engineer", "AI Engineer",
    "Software Developer", "Full Stack Developer", "Backend Developer", "Frontend Developer",
    "Cloud Engineer", "DevOps Engineer", "Cybersecurity Analyst", "Cybersecurity Engineer",
    "Database Administrator", "Data Engineer", "Business Analyst", "UI/UX Designer",
    "Mobile App Developer", "QA Engineer", "Network Engineer", "Embedded Systems Engineer",
]

EDU = ["High School", "Diploma", "Bachelor's", "Master's", "PhD"]
EXP = ["Fresher", "Intermediate", "Experienced"]
DOMAIN = ["AI", "Data", "Web", "Cloud", "Security", "Embedded", "General"]

# Ideal skill profiles per role (0-10 scale) for the 14 skill cols + interests bias
SKILL_COLS = ["python_skill","java_skill","cpp_skill","javascript_skill","sql_skill",
              "statistics_skill","machine_learning_skill","cloud_skill","web_development_skill",
              "data_analysis_skill","cybersecurity_skill","communication_skill","problem_solving_skill"]
INTEREST_COLS = ["interest_ai","interest_data","interest_web","interest_cloud","interest_security","interest_embedded"]

PROFILES = {
    "Data Analyst":            dict(python_skill=6, java_skill=2, cpp_skill=2, javascript_skill=3, sql_skill=9, statistics_skill=7, machine_learning_skill=3, cloud_skill=2, web_development_skill=2, data_analysis_skill=9, cybersecurity_skill=1, communication_skill=8, problem_solving_skill=7, interest_ai=3, interest_data=9, interest_web=2, interest_cloud=2, interest_security=1, interest_embedded=1, education_level="Bachelor's", experience_level="Fresher", preferred_domain="Data"),
    "Data Scientist":          dict(python_skill=9, java_skill=2, cpp_skill=2, javascript_skill=2, sql_skill=8, statistics_skill=9, machine_learning_skill=8, cloud_skill=3, web_development_skill=2, data_analysis_skill=9, cybersecurity_skill=1, communication_skill=7, problem_solving_skill=9, interest_ai=9, interest_data=9, interest_web=1, interest_cloud=2, interest_security=1, interest_embedded=1, education_level="Master's", experience_level="Intermediate", preferred_domain="AI"),
    "Machine Learning Engineer": dict(python_skill=9, java_skill=3, cpp_skill=4, javascript_skill=2, sql_skill=6, statistics_skill=8, machine_learning_skill=10, cloud_skill=5, web_development_skill=2, data_analysis_skill=7, cybersecurity_skill=1, communication_skill=6, problem_solving_skill=9, interest_ai=10, interest_data=6, interest_web=1, interest_cloud=4, interest_security=1, interest_embedded=2, education_level="Master's", experience_level="Intermediate", preferred_domain="AI"),
    "AI Engineer":             dict(python_skill=9, java_skill=2, cpp_skill=4, javascript_skill=3, sql_skill=5, statistics_skill=7, machine_learning_skill=10, cloud_skill=5, web_development_skill=3, data_analysis_skill=6, cybersecurity_skill=1, communication_skill=6, problem_solving_skill=9, interest_ai=10, interest_data=5, interest_web=2, interest_cloud=4, interest_security=1, interest_embedded=2, education_level="Master's", experience_level="Intermediate", preferred_domain="AI"),
    "Software Developer":      dict(python_skill=7, java_skill=7, cpp_skill=6, javascript_skill=5, sql_skill=6, statistics_skill=3, machine_learning_skill=2, cloud_skill=3, web_development_skill=5, data_analysis_skill=4, cybersecurity_skill=2, communication_skill=6, problem_solving_skill=8, interest_ai=3, interest_data=3, interest_web=5, interest_cloud=3, interest_security=2, interest_embedded=3, education_level="Bachelor's", experience_level="Fresher", preferred_domain="General"),
    "Full Stack Developer":    dict(python_skill=6, java_skill=6, cpp_skill=2, javascript_skill=9, sql_skill=7, statistics_skill=2, machine_learning_skill=1, cloud_skill=5, web_development_skill=10, data_analysis_skill=3, cybersecurity_skill=2, communication_skill=7, problem_solving_skill=8, interest_ai=2, interest_data=2, interest_web=10, interest_cloud=4, interest_security=2, interest_embedded=1, education_level="Bachelor's", experience_level="Intermediate", preferred_domain="Web"),
    "Backend Developer":       dict(python_skill=7, java_skill=8, cpp_skill=4, javascript_skill=5, sql_skill=8, statistics_skill=2, machine_learning_skill=1, cloud_skill=6, web_development_skill=7, data_analysis_skill=3, cybersecurity_skill=3, communication_skill=6, problem_solving_skill=8, interest_ai=2, interest_data=3, interest_web=8, interest_cloud=6, interest_security=2, interest_embedded=1, education_level="Bachelor's", experience_level="Intermediate", preferred_domain="Web"),
    "Frontend Developer":      dict(python_skill=3, java_skill=3, cpp_skill=1, javascript_skill=10, sql_skill=3, statistics_skill=1, machine_learning_skill=1, cloud_skill=2, web_development_skill=10, data_analysis_skill=2, cybersecurity_skill=1, communication_skill=7, problem_solving_skill=7, interest_ai=1, interest_data=1, interest_web=10, interest_cloud=1, interest_security=1, interest_embedded=1, education_level="Bachelor's", experience_level="Fresher", preferred_domain="Web"),
    "Cloud Engineer":          dict(python_skill=6, java_skill=4, cpp_skill=2, javascript_skill=3, sql_skill=5, statistics_skill=2, machine_learning_skill=2, cloud_skill=10, web_development_skill=4, data_analysis_skill=3, cybersecurity_skill=4, communication_skill=6, problem_solving_skill=8, interest_ai=2, interest_data=2, interest_web=3, interest_cloud=10, interest_security=3, interest_embedded=1, education_level="Bachelor's", experience_level="Intermediate", preferred_domain="Cloud"),
    "DevOps Engineer":         dict(python_skill=7, java_skill=4, cpp_skill=3, javascript_skill=3, sql_skill=5, statistics_skill=2, machine_learning_skill=2, cloud_skill=10, web_development_skill=4, data_analysis_skill=3, cybersecurity_skill=4, communication_skill=6, problem_solving_skill=9, interest_ai=2, interest_data=2, interest_web=3, interest_cloud=10, interest_security=3, interest_embedded=2, education_level="Bachelor's", experience_level="Intermediate", preferred_domain="Cloud"),
    "Cybersecurity Analyst":   dict(python_skill=6, java_skill=3, cpp_skill=3, javascript_skill=3, sql_skill=5, statistics_skill=3, machine_learning_skill=2, cloud_skill=4, web_development_skill=2, data_analysis_skill=4, cybersecurity_skill=10, communication_skill=7, problem_solving_skill=9, interest_ai=2, interest_data=2, interest_web=2, interest_cloud=3, interest_security=10, interest_embedded=2, education_level="Bachelor's", experience_level="Fresher", preferred_domain="Security"),
    "Cybersecurity Engineer":  dict(python_skill=7, java_skill=4, cpp_skill=5, javascript_skill=3, sql_skill=5, statistics_skill=3, machine_learning_skill=3, cloud_skill=5, web_development_skill=3, data_analysis_skill=4, cybersecurity_skill=10, communication_skill=6, problem_solving_skill=9, interest_ai=2, interest_data=2, interest_web=2, interest_cloud=4, interest_security=10, interest_embedded=3, education_level="Bachelor's", experience_level="Experienced", preferred_domain="Security"),
    "Database Administrator":  dict(python_skill=4, java_skill=3, cpp_skill=2, javascript_skill=2, sql_skill=10, statistics_skill=3, machine_learning_skill=1, cloud_skill=5, web_development_skill=2, data_analysis_skill=6, cybersecurity_skill=4, communication_skill=6, problem_solving_skill=7, interest_ai=1, interest_data=8, interest_web=1, interest_cloud=4, interest_security=3, interest_embedded=1, education_level="Bachelor's", experience_level="Intermediate", preferred_domain="Data"),
    "Data Engineer":           dict(python_skill=8, java_skill=5, cpp_skill=3, javascript_skill=2, sql_skill=10, statistics_skill=5, machine_learning_skill=4, cloud_skill=7, web_development_skill=2, data_analysis_skill=8, cybersecurity_skill=2, communication_skill=6, problem_solving_skill=8, interest_ai=4, interest_data=9, interest_web=1, interest_cloud=6, interest_security=1, interest_embedded=1, education_level="Bachelor's", experience_level="Intermediate", preferred_domain="Data"),
    "Business Analyst":        dict(python_skill=3, java_skill=1, cpp_skill=1, javascript_skill=2, sql_skill=6, statistics_skill=5, machine_learning_skill=1, cloud_skill=2, web_development_skill=2, data_analysis_skill=8, cybersecurity_skill=1, communication_skill=10, problem_solving_skill=7, interest_ai=2, interest_data=7, interest_web=2, interest_cloud=2, interest_security=1, interest_embedded=1, education_level="Bachelor's", experience_level="Fresher", preferred_domain="General"),
    "UI/UX Designer":          dict(python_skill=1, java_skill=1, cpp_skill=1, javascript_skill=6, sql_skill=1, statistics_skill=2, machine_learning_skill=1, cloud_skill=1, web_development_skill=8, data_analysis_skill=2, cybersecurity_skill=1, communication_skill=9, problem_solving_skill=7, interest_ai=2, interest_data=1, interest_web=9, interest_cloud=1, interest_security=1, interest_embedded=1, education_level="Bachelor's", experience_level="Fresher", preferred_domain="Web"),
    "Mobile App Developer":    dict(python_skill=4, java_skill=8, cpp_skill=4, javascript_skill=6, sql_skill=4, statistics_skill=2, machine_learning_skill=2, cloud_skill=3, web_development_skill=7, data_analysis_skill=2, cybersecurity_skill=2, communication_skill=6, problem_solving_skill=8, interest_ai=2, interest_data=1, interest_web=8, interest_cloud=2, interest_security=2, interest_embedded=4, education_level="Bachelor's", experience_level="Fresher", preferred_domain="Web"),
    "QA Engineer":             dict(python_skill=5, java_skill=5, cpp_skill=2, javascript_skill=5, sql_skill=6, statistics_skill=2, machine_learning_skill=1, cloud_skill=3, web_development_skill=4, data_analysis_skill=4, cybersecurity_skill=2, communication_skill=7, problem_solving_skill=8, interest_ai=1, interest_data=2, interest_web=4, interest_cloud=2, interest_security=2, interest_embedded=1, education_level="Diploma", experience_level="Fresher", preferred_domain="General"),
    "Network Engineer":        dict(python_skill=4, java_skill=2, cpp_skill=3, javascript_skill=1, sql_skill=3, statistics_skill=2, machine_learning_skill=1, cloud_skill=6, web_development_skill=1, data_analysis_skill=2, cybersecurity_skill=7, communication_skill=6, problem_solving_skill=8, interest_ai=1, interest_data=1, interest_web=1, interest_cloud=6, interest_security=8, interest_embedded=4, education_level="Bachelor's", experience_level="Intermediate", preferred_domain="Cloud"),
    "Embedded Systems Engineer": dict(python_skill=5, java_skill=3, cpp_skill=10, javascript_skill=1, sql_skill=2, statistics_skill=3, machine_learning_skill=3, cloud_skill=2, web_development_skill=1, data_analysis_skill=2, cybersecurity_skill=3, communication_skill=5, problem_solving_skill=9, interest_ai=3, interest_data=1, interest_web=1, interest_cloud=1, interest_security=2, interest_embedded=10, education_level="Bachelor's", experience_level="Intermediate", preferred_domain="Embedded"),
}

EDU_RANK = {"High School": 0, "Diploma": 1, "Bachelor's": 2, "Master's": 3, "PhD": 4}
EXP_RANK = {"Fresher": 0, "Intermediate": 1, "Experienced": 2}


def gen_row(role, rng):
    p = PROFILES[role]
    row = {}
    # numeric skills: ideal + gaussian noise, clip 0-10
    for c in SKILL_COLS + INTEREST_COLS:
        v = p[c] + rng.normal(0, 1.6)
        row[c] = int(np.clip(round(v), 0, 10))
    # categoricals: mostly ideal, sometimes mutate
    if rng.random() < 0.15:
        row["education_level"] = rng.choice(EDU)
    else:
        # jitter education around ideal
        idx = EDU_RANK[p["education_level"]] + rng.choice([-1, 0, 0, 0, 1])
        idx = int(np.clip(idx, 0, 4))
        row["education_level"] = EDU[idx]
    if rng.random() < 0.15:
        row["experience_level"] = rng.choice(EXP)
    else:
        row["experience_level"] = p["experience_level"]
    if rng.random() < 0.12:
        row["preferred_domain"] = rng.choice(DOMAIN)
    else:
        row["preferred_domain"] = p["preferred_domain"]
    row["career_role"] = role
    return row


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=2000)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--out", type=str, default="data/career_dataset.csv")
    args = ap.parse_args()
    rng = np.random.default_rng(args.seed)
    per = args.n // len(ROLES)
    rows = []
    for r in ROLES:
        for _ in range(per):
            rows.append(gen_row(r, rng))
    # remainder
    while len(rows) < args.n:
        rows.append(gen_row(rng.choice(ROLES), rng))
    rng.shuffle(rows)
    df = pd.DataFrame(rows)
    cols = (["education_level"] + SKILL_COLS + INTEREST_COLS + ["experience_level", "preferred_domain", "career_role"])
    df = df[cols]
    out = Path(__file__).resolve().parent.parent / args.out
    out.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out, index=False)
    print(f"Wrote {len(df)} rows -> {out}")
    print(df["career_role"].value_counts().to_string())


if __name__ == "__main__":
    main()
