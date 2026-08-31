import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import get_settings
from app.core.security import get_current_user_id
from app.main import app

pytestmark = pytest.mark.anyio


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
def override_user_id():
    app.dependency_overrides[get_current_user_id] = lambda: "test_copilot_user"
    yield
    app.dependency_overrides.pop(get_current_user_id, None)


async def test_copilot_chat_endpoint(override_user_id):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/api/v1/copilot/chat",
            json={
                "messages": [
                    {"role": "user", "content": "Какие у меня шансы на поступление в MIT?"}
                ],
                "include_context": False,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data
        assert len(data["reply"]) > 0
        assert "suggested_followups" in data
