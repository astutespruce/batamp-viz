# North American Bat Monitoring Program

## Data Access

Go to https://sciencebase.usgs.gov/nabat/#/explore and login.

### Data exploration

Login to NABat, then go to the GraphQL explorer:
https://api.sciencebase.gov/nabat-graphql/graphiql

In the NABat main page, click the API link in the upper right and copy the
token.

Enter the token into the request headers section:

```json
{
  "Authorization": "Bearer <token>"
}
```

Then click the "Unsaved headers" button in the upper right of the GraphQL explorer,
and reload the page, which will refresh the available types on the left.
