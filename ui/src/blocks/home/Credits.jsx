import React from 'react'
import { Box, Grid, Image, Paragraph } from 'theme-ui'

import { OutboundLink } from 'components/Link'
import CBILogo from 'images/cbi_logo.png'
import CDFWLogo from 'images/cdfw_logo.jpg'
import USFSLogo from 'images/usfs_logo.png'

const About = () => (
  <Box
    sx={{
      pt: '3rem',
      mt: '2rem',
      borderTop: '0.5rem solid',
      borderTopColor: 'primary.5',
    }}
  >
    <Grid columns={[0, '1.5fr 1fr']} gap={4}>
      <Box>
        <Paragraph sx={{ fontSize: 2 }}>
          This project was initially developed by{' '}
          <a href="mailto:bcward@astutespruce.com">Brendan C. Ward</a> at
          the&nbsp;
          <OutboundLink
            to="https://consbio.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Conservation Biology Institute
          </OutboundLink>
          &nbsp; (CBI), now with{' '}
          <OutboundLink to="https://astutespruce.com/" target="_blank">
            Astute Spruce, LLC
          </OutboundLink>
          , in partnership with{' '}
          <OutboundLink to="https://www.fs.fed.us/psw/programs/cb/staff/tweller/">
            Ted Weller
          </OutboundLink>{' '}
          at the&nbsp;
          <OutboundLink to="https://www.fs.fed.us/psw/index.shtml">
            U.S. Department of Agriculture Forest Service - Pacific Southwest
            Research Station
          </OutboundLink>
          .
        </Paragraph>
      </Box>
      <Grid columns="3fr 1fr 1fr" gap={3}>
        <Image
          src={CBILogo}
          alt="CBI logo"
          sx={{
            maxHeight: '48px',
          }}
        />
        <Image
          src={USFSLogo}
          alt="USFS logo"
          sx={{
            maxHeight: '72px',
          }}
        />
        <Image src={CDFWLogo} alt="CDFW logo" sx={{ maxHeight: '72px' }} />
      </Grid>
    </Grid>
    <Paragraph sx={{ mt: '1rem', fontSize: 2 }}>
      This project is also supported in part by the{' '}
      <OutboundLink to="https://wildlife.ca.gov/">
        California Department of Fish and Wildlife
      </OutboundLink>{' '}
      through a{' '}
      <OutboundLink to="https://www.fws.gov/program/state-wildlife-grants">
        U.S. Fish and Wildlife Service State Wildlife Grant
      </OutboundLink>
      .
    </Paragraph>
  </Box>
)

export default About
