from fastapi import APIRouter

router = APIRouter()

@router.get("/profile")
def get_profile():
    return {"id": 1, "name": "Demo Company", "email": "admin@democompany.com", "plan": "Pro"}
