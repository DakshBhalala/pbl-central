from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.students import router as students_router
from app.api.v1.faculty import router as faculty_router
from app.api.v1.admin import router as admin_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.academic import router as academic_router

api_v1_router = APIRouter()
api_v1_router.include_router(auth_router)
api_v1_router.include_router(students_router)
api_v1_router.include_router(faculty_router)
api_v1_router.include_router(admin_router)
api_v1_router.include_router(notifications_router)
api_v1_router.include_router(academic_router)
