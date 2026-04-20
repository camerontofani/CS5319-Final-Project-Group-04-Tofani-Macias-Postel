from typing import Any


def default_study_groups(uid: int) -> list[dict[str, Any]]:
    return [
        {
            "id": f"{uid}-g1",
            "name": "CS301 Algo Squad",
            "shortName": "CS301",
            "memberCount": 4,
            "milestonePct": 60,
            "description": "Cracking algorithms together before finals",
            "nextMeeting": "Thu, Mar 5 · 7pm",
            "members": [
                {
                    "id": "m1",
                    "name": "You",
                    "role": "You",
                    "goal": "Finish DP chapter + 5 practice problems",
                    "progress": "2/5",
                    "status": "checked_in",
                },
                {
                    "id": "m2",
                    "name": "Maya Patel",
                    "goal": "Review binary tree problems",
                    "progress": "3/3",
                    "status": "checked_in",
                },
                {"id": "m3", "name": "Jake Lee", "goal": "Goal not shared", "progress": "", "status": "pending"},
                {
                    "id": "m4",
                    "name": "Sofia Chen",
                    "role": "Organizer",
                    "goal": "Graph traversal + BFS/DFS",
                    "progress": "1/4",
                    "status": "checked_in",
                },
            ],
        },
        {
            "id": f"{uid}-g2",
            "name": "OS Study Circle",
            "shortName": "OS",
            "memberCount": 2,
            "milestonePct": 40,
            "description": "Operating systems deep dives",
            "nextMeeting": "Wed, Mar 4 · 6pm",
            "members": [
                {
                    "id": "o1",
                    "name": "You",
                    "role": "You",
                    "goal": "Read paging chapter",
                    "progress": "1/2",
                    "status": "checked_in",
                },
                {"id": "o2", "name": "Sam Rivera", "goal": "Scheduling problems", "progress": "0/3", "status": "pending"},
            ],
        },
        {
            "id": f"{uid}-g3",
            "name": "Database Design",
            "shortName": "DB",
            "memberCount": 2,
            "milestonePct": 75,
            "description": "Normalization and SQL",
            "nextMeeting": "Sat, Mar 7 · 10am",
            "members": [
                {
                    "id": "d1",
                    "name": "You",
                    "role": "You",
                    "goal": "Transactions & ACID quiz",
                    "progress": "2/4",
                    "status": "checked_in",
                },
                {"id": "d2", "name": "Priya N.", "goal": "ER diagrams", "progress": "1/1", "status": "checked_in"},
            ],
        },
    ]


def default_group_slice(uid: int) -> dict[str, Any]:
    return {
        "studyGroups": default_study_groups(uid),
        "groupData": {},
    }
