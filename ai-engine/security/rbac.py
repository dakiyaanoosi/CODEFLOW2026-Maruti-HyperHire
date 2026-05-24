"""
Role-Based Access Control (RBAC) Module
"""

from enum import Enum
from typing import List, Optional, Dict, Set

from fastapi import (
    HTTPException,
    status,
    Depends
)

import logging

from security.auth import (
    get_current_user,
    UserClaims
)

logger = logging.getLogger(__name__)


class UserRole(str, Enum):
    ADMIN = "admin"
    RECRUITER = "recruiter"
    CANDIDATE = "candidate"
    STUDENT = "student"


class Permission(str, Enum):

    CREATE_JOB = "create_job"
    EDIT_JOB = "edit_job"
    DELETE_JOB = "delete_job"
    VIEW_JOB = "view_job"

    VIEW_APPLICATIONS = "view_applications"

    RUN_MATCHING = "run_matching"
    RUN_RECOMMENDATIONS = "run_recommendations"


class RBACManager:

    ROLE_PERMISSIONS: Dict[
        UserRole,
        Set[Permission]
    ] = {

        UserRole.ADMIN: {
            Permission.CREATE_JOB,
            Permission.EDIT_JOB,
            Permission.DELETE_JOB,
            Permission.VIEW_JOB,
            Permission.VIEW_APPLICATIONS,
            Permission.RUN_MATCHING,
            Permission.RUN_RECOMMENDATIONS,
        },

        UserRole.RECRUITER: {
            Permission.CREATE_JOB,
            Permission.EDIT_JOB,
            Permission.VIEW_JOB,
            Permission.VIEW_APPLICATIONS,
            Permission.RUN_MATCHING,
        },

        UserRole.STUDENT: {
            Permission.VIEW_JOB,
        },

        UserRole.CANDIDATE: {
            Permission.VIEW_JOB,
        },
    }

    @staticmethod
    def get_role_permissions(
        role: UserRole
    ) -> Set[Permission]:

        return RBACManager.ROLE_PERMISSIONS.get(
            role,
            set()
        )

    @staticmethod
    def has_permission(
        role: UserRole,
        permission: Permission
    ) -> bool:

        role_perms = RBACManager.get_role_permissions(
            role
        )

        return permission in role_perms


def require_role(required_role: UserRole):

    async def role_checker(
        current_user: UserClaims = Depends(
            get_current_user
        )
    ):

        if current_user.role != required_role.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"{required_role.value} access required"
            )

        return current_user

    return role_checker