import React from 'react'
import PropTypes from 'prop-types'
import { FaRegTimesCircle } from 'react-icons/fa'

import { Text } from 'components/Text'
import Tabs, { Tab as BaseTab } from 'components/Tabs'
import { OutboundLink } from 'components/Link'
import { Column, Columns, Box, Flex } from 'components/Grid'
import styled, { themeGet } from 'style'
import { formatNumber } from 'util/format'
import { COUNTRIES } from '../../../config/constants'

const Wrapper = styled.div``

const Header = styled.div``

const Title = styled(Text).attrs({
  fontSize: ['1rem', '1rem', '1.5rem'],
})``

const Subtitle = styled(Text).attrs({
  fontSize: ['0.8rem', '0.8rem', '1rem'],
})``

const Stats = styled(Box).attrs({ px: '1rem' })`
  border-top: 1px solid ${themeGet('colors.grey.400')};
  border-bottom: 1px solid ${themeGet('colors.grey.400')};
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

const TabContainer = styled(Tabs)`
  height: 100%;
`

const Tab = styled(BaseTab)`
  padding: 1rem;
  overflow-y: auto;
  flex: 1 1 auto;
`

const Field = styled.section`
  &:not(:first-child) {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid ${themeGet('colors.grey.200')};
  }
`

const FieldHeader = styled.h4`
  margin-bottom: 0;
`

const FieldValue = styled.div``

const FieldValueList = styled.ul``

const formatDateRange = dateRange => {
  if (dateRange.length === 1) return dateRange[0]

  return dateRange.join(' - ')
}

const Details = ({
  id,
  lat,
  lon,
  micHeight,
  detections,
  nights,
  dateRange,
  contributors,
  mfg,
  model,
  micType,
  reflType,
  idMethods,
  datasets,
  adminName,
  country,
  species,
  speciesPresent,
  speciesRanges,
  onClose,
}) => {
  return (
    <Wrapper>
      <Header>
        <Columns>
          <Column flex={1}>
            <Title>
              Detector at {lat}°N / {lon}° E <br />
              {micHeight} meters high.
            </Title>
          </Column>
          <Column flex={0}>
            <CloseIcon onClick={onClose} />
          </Column>
        </Columns>
        <Subtitle>
          {adminName}, {COUNTRIES[country]}
        </Subtitle>
        <Stats>
          <b>{detections}</b> detections on <b>{nights}</b> nights during{' '}
          <b>{formatDateRange(dateRange)}</b>.
        </Stats>
      </Header>

      <TabContainer>
        <Tab id="species" label="Species Detections">
          TODO Also TODO: highlight if any species are out of their ranges
        </Tab>
        <Tab id="overview" label="Detector Information">
          <Field>
            <FieldHeader>Detector data contributed by:</FieldHeader>
            <FieldValue>{contributors.join(', ')}</FieldValue>
          </Field>

          {mfg ? (
            <Field>
              <FieldHeader>Detector model:</FieldHeader>
              <FieldValue>
                {mfg}
                {model ? `(${model})` : null}
              </FieldValue>
            </Field>
          ) : null}

          {micType ? (
            <Field>
              <FieldHeader>Microphone type:</FieldHeader>
              <FieldValue>{micType}</FieldValue>
            </Field>
          ) : null}

          {reflType ? (
            <Field>
              <FieldHeader>Reflector type:</FieldHeader>
              <FieldValue>{reflType}</FieldValue>
            </Field>
          ) : null}

          {idMethods && idMethods.length ? (
            <Field>
              <FieldHeader>How were species identified?</FieldHeader>
              <FieldValueList>
                {idMethods.map(method => (
                  <li>{method}</li>
                ))}
              </FieldValueList>
            </Field>
          ) : null}

          <Field>
            <FieldHeader>Source datasets:</FieldHeader>
            <FieldValueList>
              {datasets.map(dataset => (
                <li>
                  <OutboundLink
                    from="/"
                    to={`https://batamp.databasin.org/datasets/${dataset}`}
                    target="_blank"
                  >
                    {dataset}
                  </OutboundLink>
                </li>
              ))}
            </FieldValueList>
          </Field>
        </Tab>
      </TabContainer>
    </Wrapper>
  )
}

Details.propTypes = {
  id: PropTypes.string.isRequired,
  lat: PropTypes.number.isRequired,
  lon: PropTypes.number.isRequired,
  micHeight: PropTypes.number.isRequired,
  detections: PropTypes.number.isRequired,
  nights: PropTypes.number.isRequired,
  dateRange: PropTypes.arrayOf(PropTypes.string).isRequired,
  contributors: PropTypes.number.isRequired,
  mfg: PropTypes.string,
  model: PropTypes.string,
  micType: PropTypes.string,
  reflType: PropTypes.string,
  idMethods: PropTypes.arrayOf(PropTypes.string),
  datasets: PropTypes.arrayOf(PropTypes.string).isRequired,
  speciesPresent: PropTypes.arrayOf(PropTypes.string).isRequired,
  speciesRanges: PropTypes.arrayOf(PropTypes.string).isRequired,
  adminName: PropTypes.string.isRequired,
  country: PropTypes.string.isRequired,
  species: PropTypes.string,
  onClose: PropTypes.func.isRequired,
}

Details.defaultProps = {
  species: null,
  mfg: null,
  model: null,
  micType: null,
  reflType: null,
  idMethods: null,
}

export default Details
