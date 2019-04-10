import React from 'react'
import PropTypes from 'prop-types'
import { graphql, navigate } from 'gatsby'

import { OutboundLink } from 'components/Link'
import { Button } from 'components/Button'
import Layout from 'components/Layout'
import { Container } from 'components/Grid'
import styled from 'util/style'

const BodyText = styled.p`
  font-size: larger;
`

const IndexPage = ({ data: { headerImage: img } }) => (
  <Layout
    title="Home"
    headerImage={{
      img,
      author: 'Michael Durham/Minden Pictures, Bat Conservation International',
      url:
        'https://www.flickr.com/photos/mypubliclands/46056678782/in/album-72157699760909522/',
    }}
  >
    <Container paddingBottom="3rem">
      TODO
      {/* <h2>
        This tool helps you prepare information for bat monitoring efforts in
        North America, including:
      </h2>
      <ul>
        <li>
          <OutboundLink from="/" to="https://batamp.databasin.org/">
            Bat Acoustic Monitoring Portal
          </OutboundLink>
        </li>
        <li>
          <OutboundLink from="/" to="https://www.nabatmonitoring.org/">
            North American Bat Monitoring Program
          </OutboundLink>
        </li>
      </ul>

      <BodyText>
        This tool will help you &quot;fuzz&quot; the coordinates of your bat
        monitoring location, so that you can more easily share your data with
        other monitoring efforts.
        <br />
        <br />
        You can also use this tool to find the monitoring grid cell ID for your
        location.
      </BodyText>

      <Container style={{ textAlign: 'center' }}>
        <Button primary onClick={() => navigate('/map')}>
          Get Started
        </Button>
      </Container> */}
    </Container>
  </Layout>
)

IndexPage.propTypes = {
  data: PropTypes.shape({
    headerImage: PropTypes.object.isRequired,
  }).isRequired,
}

export const pageQuery = graphql`
  query HomePageQuery {
    headerImage: file(relativePath: { eq: "46056678782_da46dcec08_o.jpg" }) {
      childImageSharp {
        fluid(maxWidth: 3200) {
          ...GatsbyImageSharpFluid_withWebp
        }
      }
    }
  }
`

export default IndexPage
