import pandas as pd

from analysis.constants import NABAT_URL


async def get_user_projects(client, token, user_id):
    """Download lookup table of all projects user has a role in.

    Parameters
    ----------
    client : httpx.AsyncClient,
    token : str
        NABat token
    user_id : int
        user ID

    Returns
    -------
    DataFrame
    """
    query = """query allVwUserProjects($userId: Int!) {
        allVwUserProjects(filter: {userId: {equalTo: $userId}}) {
            nodes {
                id: projectId
                name: projectName
            }
        }
    }
    """

    request = await client.post(
        NABAT_URL,
        json={
            "operationName": "allVwUserProjects",
            "query": query,
            "variables": {"userId": user_id},
        },
        headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
    )
    request.raise_for_status()

    # projects may appear multiple times if requesting user has multiple roles in project
    df = pd.DataFrame(request.json()["data"]["allVwUserProjects"]["nodes"]).drop_duplicates(subset="id")
    df["id"] = df.id.astype("uint")
    df["name"] = df.name.fillna("").str.strip()

    return df


async def get_project_info(client, token, project_ids):
    """Get project metadata for specified projects

    Parameters
    ----------
    client : httpx.AsyncClient
    token : str
        NABat token
    project_ids : list
        list of project IDs

    Returns
    -------
    DataFrame
    """
    query = """query allProjects($projectIds: [Int!]!) {
        allProjects(filter: {id: {in: $projectIds}}) {
            nodes {
                id
                name: projectName
                organization: organizationByOrganizationId {
                    name
                }
                # collaborating organizations
                collaborating_organizations: projectAssociationsByProjectId {
                    nodes {
                        organization: organizationByOrganizationId {
                            name
                        }
                    }
                }
                # project leaders
                # roleId 2 = Project Leader
                leaders: userProjectsByProjectId(filter: {roleId: {equalTo: 2}}) {
                    nodes {
                        role: roleByRoleId {
                            role
                        }
                        user: userByUserId {
                            first: firstName
                            last: lastName
                        }
                    }
                }
                surveys: surveysByProjectId {
                    count: totalCount  # count of surveys for project
                    nodes {
                      survey_events: surveyEventsBySurveyId {
                        count: totalCount  # count of night events per survey
                      }
                    }
                }
            }
        }
    }
    """

    request = await client.post(
        NABAT_URL,
        json={
            "operationName": "allProjects",
            "query": query,
            "variables": {"projectIds": project_ids},
        },
        headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
    )
    request.raise_for_status()

    df = pd.DataFrame(request.json()["data"]["allProjects"]["nodes"])
    df["id"] = df.id.astype("uint")
    df["name"] = df.name.fillna("").str.strip()

    # unpack nested fields
    df["organization"] = df.organization.apply(lambda x: x["name"])
    df["collaborating_organizations"] = df.collaborating_organizations.apply(
        lambda x: ",".join([e["organization"]["name"].strip() for e in x["nodes"]])
    )
    df["num_surveys"] = df.surveys.apply(lambda x: x["count"])
    df["num_survey_events"] = df.surveys.apply(lambda x: sum([e["survey_events"]["count"] for e in x["nodes"]]))

    # extract these as a comma-delimited sorted list
    df["leaders"] = (
        df.leaders.apply(lambda x: [f"{e['user']['first'].strip()} {e['user']['last'].strip()}" for e in x["nodes"]])
        .apply(lambda x: ["Ted Weller" if v == "Ted depreciated-weller" else v for v in x])
        .apply(set)
        .apply(sorted)
        .apply(",".join)
    )

    return df
