import React, { memo } from 'react'
import PropTypes from 'prop-types'
import { FaRegTimesCircle } from 'react-icons/fa'
import { Columns, Column, Flex, Box } from 'components/Grid'
import styled, { themeGet } from 'style'
import { formatNumber } from 'util/format'
import { COUNTRIES } from '../../../config/constants'

const Wrapper = styled.div``

const Header = styled.div``

const Title = styled(Text).attrs({
  fontSize: ['1rem', '1rem', '1.5rem'],
})``

const Country = styled(Text).attrs({
  fontSize: ['0.8rem', '0.8rem', '1rem'],
})`
  color: ${themeGet('colors.grey.600')};
`

const Stats = styled(Columns).attrs({ px: '1rem' })`
  border-top: 1px solid ${themeGet('colors.grey.400')};
  border-bottom: 1px solid ${themeGet('colors.grey.400')};
  color: ${themeGet('colors.grey.800')};
  font-size: 0.8rem;
`

const CloseIcon = styled(FaRegTimesCircle).attrs({ size: '1.5rem' })`
  height: 1.5rem;
  width: 1.5rem;
  cursor: pointer;
  color: ${themeGet('colors.grey.600')};
  &:hover {
    color: ${themeGet('colors.grey.900')};
  }
`

const RightColumn = styled(Column)`
  text-align: right;
`

const SummaryUnitDetails = ({
  id,
  name,
  country,
  detections,
  nights,
  detectors,
  contributors,
  onClose,
}) => {
  return (
    <Wrapper>
      <Header>
        <Columns>
          <Column flex="1 1 auto">
            <Title>
              {name}, <Country>{COUNTRIES[country]}</Country>
            </Title>
          </Column>
          <Column flex="0 0 auto">
            <CloseIcon onClick={onClose} />
          </Column>
        </Columns>
        <Stats>
          <Column>
            {formatNumber(detections, 0)} detections
            <br />
            {formatNumber(nights, 0)} nights
          </Column>
          <RightColumn>
            {detectors} detectors
            <br />
            {contributors ? (
              <>
                {contributors.length}{' '}
                {contributors.length === 1 ? 'contributor' : 'contributors'}
              </>
            ) : null}
          </RightColumn>
        </Stats>
      </Header>
    </Wrapper>
  )
}

SummaryUnitDetails.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string.isRequired,
  country: PropTypes.string.isRequired,
  detections: PropTypes.number.isRequired,
  nights: PropTypes.number.isRequired,
  detectors: PropTypes.number.isRequired,
  contributors: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
}

export default memo(SummaryUnitDetails)
