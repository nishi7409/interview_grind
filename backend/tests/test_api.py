"""Endpoint and sandbox tests. Run: cd backend && pytest -q"""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["language"] == "python"
    assert body["problems"] > 0


def test_list_problems_and_filter():
    r = client.get("/api/problems")
    assert r.status_code == 200
    data = r.json()
    assert data["count"] == data["total"] > 0

    r2 = client.get("/api/problems", params={"difficulty": "Easy"})
    assert r2.status_code == 200
    assert all(p["difficulty"] == "Easy" for p in r2.json()["problems"])

    r3 = client.get("/api/problems", params={"tag": "Hash Table"})
    assert r3.status_code == 200
    assert all("Hash Table" in p["tags"] for p in r3.json()["problems"])

    r4 = client.get("/api/problems", params={"q": "two"})
    assert any(p["slug"] == "two-sum" for p in r4.json()["problems"])


def test_get_problem_detail_and_404():
    r = client.get("/api/problems/two-sum")
    assert r.status_code == 200
    p = r.json()
    assert p["entry_point"] == "twoSum"
    assert "starter_code" in p and p["language"] == "python"

    assert client.get("/api/problems/does-not-exist").status_code == 404


def test_tags():
    r = client.get("/api/problems/tags")
    assert r.status_code == 200
    assert "Array" in r.json()


def test_run_free_code():
    r = client.post("/api/problems/run", json={"code": "print('hello')"})
    assert r.status_code == 200
    body = r.json()
    assert body["ok"] is True
    assert "hello" in body["stdout"]


def test_submit_correct_solution_passes():
    code = (
        "class Solution:\n"
        "    def twoSum(self, nums, target):\n"
        "        seen = {}\n"
        "        for i, n in enumerate(nums):\n"
        "            if target - n in seen:\n"
        "                return [seen[target - n], i]\n"
        "            seen[n] = i\n"
        "        return []\n"
    )
    r = client.post("/api/problems/two-sum/submit", json={"code": code})
    assert r.status_code == 200
    body = r.json()
    assert body["passed"] is True
    assert body["passed_count"] == body["total"]


def test_submit_wrong_solution_fails():
    code = (
        "class Solution:\n"
        "    def twoSum(self, nums, target):\n"
        "        return [0, 0]\n"
    )
    r = client.post("/api/problems/two-sum/submit", json={"code": code})
    body = r.json()
    assert body["passed"] is False
    assert body["passed_count"] < body["total"]


def test_submit_unordered_groups_grading():
    # 3Sum uses unordered comparison; a correct-but-differently-ordered answer should pass.
    code = (
        "class Solution:\n"
        "    def threeSum(self, nums):\n"
        "        nums.sort()\n"
        "        res = []\n"
        "        for i in range(len(nums) - 2):\n"
        "            if i > 0 and nums[i] == nums[i-1]:\n"
        "                continue\n"
        "            l, r = i + 1, len(nums) - 1\n"
        "            while l < r:\n"
        "                s = nums[i] + nums[l] + nums[r]\n"
        "                if s < 0:\n"
        "                    l += 1\n"
        "                elif s > 0:\n"
        "                    r -= 1\n"
        "                else:\n"
        "                    res.append([nums[i], nums[l], nums[r]])\n"
        "                    l += 1\n"
        "                    r -= 1\n"
        "                    while l < r and nums[l] == nums[l-1]:\n"
        "                        l += 1\n"
        "                    while l < r and nums[r] == nums[r+1]:\n"
        "                        r -= 1\n"
        "        return res\n"
    )
    r = client.post("/api/problems/3sum/submit", json={"code": code})
    assert r.json()["passed"] is True


def test_sandbox_blocks_infinite_loop():
    r = client.post("/api/problems/run", json={"code": "while True:\n    pass"})
    body = r.json()
    assert body["ok"] is False
    assert body["error"] is not None


def test_system_design_content():
    r = client.get("/api/system-design")
    assert r.status_code == 200
    body = r.json()
    assert len(body["rubric"]) == 4
    assert len(body["delivery_framework"]["steps"]) >= 1
    assert len(body["questions"]) >= 1

    q = client.get("/api/system-design/questions/design-rate-limiter")
    assert q.status_code == 200
    assert q.json()["type"] == "Infrastructure Design"
