import React, { memo } from 'react'
import PropTypes from 'prop-types'
import ImmutablePropTypes from 'react-immutable-proptypes'

import { Columns, Column } from 'components/Grid'
import { Link } from 'components/Link'
import { Text } from 'components/Text'
import styled, { themeGet, theme } from 'style'
import { formatNumber } from 'util/format'

const Wrapper = styled.div`
  &:not(:first-child) {
    border-top: 1px solid ${themeGet('colors.grey.100')};
  }
`

const Content = styled.div`
  line-height: 1.2;
  padding: 1rem;
  color: ${themeGet('colors.grey.600')};

  &:hover {
    background-color: ${theme.colors.primary[100]}50;
  }
`

const Name = styled.div`
  color: ${themeGet('colors.link')};
  font-size: 1.25rem;
`

const ScientificName = styled.div`
  font-size: 0.8rem;
  color: ${themeGet('colors.grey.600')};
`

const Stats = styled.div`
  font-size: 0.8rem;
  text-align: right;
`

const ListItem = ({ item }) => {
  const { species, commonName, sciName, detections, nights } = item.toJS()

  return (
    <Wrapper>
      <Link to={`/species/${species}`}>
        <Content>
          <Columns>
            <Column>
              <Name>{commonName}</Name>
              <ScientificName>({sciName})</ScientificName>
            </Column>
            <Column>
              <Stats>
                {formatNumber(detections, 0)} detections
                <br />
                on {formatNumber(nights, 0)} nights
              </Stats>
            </Column>
          </Columns>
        </Content>
      </Link>
    </Wrapper>
  )
}

ListItem.propTypes = {
  item: ImmutablePropTypes.mapContains({
    species: PropTypes.string.isRequired,
    commonName: PropTypes.string.isRequired,
    sciName: PropTypes.string.isRequired,
    detections: PropTypes.number.isRequired,
    nights: PropTypes.number.isRequired,
  }).isRequired,
}

// only rerender on ID change
export default memo(ListItem, ({ item: prevItem }, { item: nextItem }) =>
  prevItem.equals(nextItem)
)
