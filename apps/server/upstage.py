import os

import httpx

UPSTAGE_API_KEY = os.environ["UPSTAGE_API_KEY"]
UPSTAGE_URL = "https://api.upstage.ai/v1/chat/completions"


class UpstageError(Exception):
    pass


def _build_prompt(trip, places) -> str:
    lines = [f"여행 제목: {trip.title}"]
    if trip.start_date and trip.end_date:
        lines.append(f"기간: {trip.start_date} ~ {trip.end_date}")

    if places:
        lines.append("방문한 장소:")
        for place in places:
            detail = place.name or "(이름 없음)"
            if place.memo:
                detail += f" - {place.memo}"
            if place.rating:
                detail += f" (평점 {place.rating})"
            lines.append(f"- {detail}")
    else:
        lines.append("방문한 장소 정보는 없음.")

    lines.append(
        "\n위 여행 정보를 바탕으로 감성적인 여행 일기와 짧은 감성 뱃지를 만들어줘. "
        "일기는 3~5문장 정도로 쓰고, 글자수나 분량을 괄호 등으로 표시하지 마. "
        "다른 말은 절대 하지 말고 반드시 아래 두 줄 형식으로만 답해:\n"
        "BADGE: <2~4단어 감성 뱃지>\n"
        "ESSAY: <감성 여행 일기 본문>"
    )
    return "\n".join(lines)


async def generate_trip_summary(trip, places) -> tuple[str, str]:
    prompt = _build_prompt(trip, places)

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                UPSTAGE_URL,
                headers={"Authorization": f"Bearer {UPSTAGE_API_KEY}"},
                json={
                    "model": "solar-pro2",
                    "messages": [{"role": "user", "content": prompt}],
                },
            )
            response.raise_for_status()
    except httpx.HTTPError as e:
        raise UpstageError(f"Upstage request failed: {e}")

    content = response.json()["choices"][0]["message"]["content"]

    badge, essay = None, None
    for line in content.splitlines():
        if line.startswith("BADGE:"):
            badge = line.removeprefix("BADGE:").strip()
        elif line.startswith("ESSAY:"):
            essay = line.removeprefix("ESSAY:").strip()

    if not badge or not essay:
        raise UpstageError(f"Could not parse Upstage response: {content!r}")

    return badge, essay
