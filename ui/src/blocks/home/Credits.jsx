import React from 'react'
import { Box, Flex, Grid, Image, Paragraph } from 'theme-ui'

import { OutboundLink } from 'components/Link'
import CBILogo from 'images/cbi_logo.png'
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
          This application was created by{' '}
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
          </OutboundLink>{' '}
          in partnership with{' '}
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
      <Flex
        sx={{
          justifyContent: 'flex-end',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '2rem',
        }}
      >
        <Image
          src={CBILogo}
          alt="CBI logo"
          sx={{ height: '48px', width: '218px' }}
        />
        <Image
          src={USFSLogo}
          alt="USFS logo"
          sx={{ height: '72px', width: '66px' }}
        />
      </Flex>
    </Grid>
  </Box>
)

export default About
