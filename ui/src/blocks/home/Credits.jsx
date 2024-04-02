import React from 'react'
import { Image } from 'rebass'

import { Columns, Column as BaseColumn, Flex } from 'components/Grid'
import { OutboundLink } from 'components/Link'
import styled, { themeGet } from 'style'
import CBILogo from 'images/cbi_logo.png'
import USFSLogo from 'images/usfs_logo.png'
import { Section as BaseSection } from './styles'

const Section = styled(BaseSection)`
  border-top: 0.5rem solid ${themeGet('colors.primary.700')};
  p {
    font-size: 0.9rem;
  }
`

const Column = styled(BaseColumn).attrs({
  width: ['100%', '100%', '30%'],
})``

const Logos = styled(Flex).attrs({ alignItems: 'center', flexWrap: 'wrap' })``

const Logo = styled.img`
  margin: 0.5rem 1rem;
`

const About = () => (
  <Section>
    <Columns>
      <Column>
        <p>
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
        </p>
      </Column>
      <Column>
        <Logos>
          <Logo src={CBILogo} alt="CBI logo" />
          <Logo src={USFSLogo} alt="USFS logo" />
        </Logos>
      </Column>
    </Columns>
  </Section>
)

export default About
