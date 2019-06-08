import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { Flex } from 'components/Grid'
import { Text } from 'components/Text'
import { formatNumber } from 'util/format'
import styled, { css, themeGet } from 'style'

const Wrapper = styled(Flex).attrs({ flexDirection: 'column' })`
  flex: 1;
  height: 100%;

  transition: opacity 300ms;
  opacity: ${({ isExcluded }) => (isExcluded ? 0.25 : 1)};

  &:hover {
    opacity: ${({ isExcluded }) => (isExcluded ? 0.5 : 1)};
  }
`

const BarWrapper = styled.div`
  cursor: pointer;
  height: 100%;
  position: relative;
  border-bottom: 1px solid ${themeGet('colors.grey.200')};
`

// height set dynamically using style
const Bar = styled.div`
  background-color: ${themeGet('colors.primary.400')};
  border-top: 2px solid ${themeGet('colors.primary.600')};
  border-left: 1px solid ${themeGet('colors.grey.200')};
  border-right: 1px solid ${themeGet('colors.grey.200')};

  opacity: 0.6;
  max-width: 40px;
  margin-left: auto;
  margin-right: auto;

  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;

  ${BarWrapper}:hover & {
    opacity: 1;
  }
`

const FilteredBar = styled(Bar)`
  background-color: ${themeGet('colors.highlight.500')};
  border-top-color: ${themeGet('colors.highlight.600')};
`

const EmptyBar = styled(Bar)`
  border: none;
`

const Label = styled(Text).attrs({ fontSize: '0.6rem' })`
  color: ${themeGet('colors.grey.600')};
  text-align: center;
`

const FilteredLabel = styled(Label)`
  color: ${themeGet('colors.highlight.500')};
  font-weight: bold;
`

const TooltipLeader = styled.div`
  width: 1px;
  height: calc(100% + 0.1rem);
  background: ${themeGet('colors.grey.900')};
  display: none;
  position: absolute;
  bottom: 0;
  left: 50%;
  margin-left: -1px;

  ${BarWrapper}:hover & {
    display: block;
  }
`

const Tooltip = styled(Text)`
  font-size: 0.8rem;
  color: ${themeGet('colors.grey.600')};
  position: absolute;
  text-align: center;
  top: -1.25rem;
  left: -2rem;
  right: -2rem;

  display: none;
  ${BarWrapper}:hover & {
    display: block;
  }
`

const VerticalBar = ({
  isFiltered,
  isExcluded,
  label,
  quantity,
  scale,
  onClick,
}) => {
  // const maxHeight = scale(max) + 6

  return (
    <Wrapper isExcluded={isExcluded}>
      <BarWrapper onClick={onClick}>
        {quantity > 0 ? (
          <>
            {isFiltered ? (
              <FilteredBar style={{ height: `${scale(quantity)}%` }} />
            ) : (
              <Bar style={{ height: `${scale(quantity)}%` }} />
            )}
          </>
        ) : (
          <EmptyBar />
        )}

        <Tooltip>{formatNumber(quantity)}</Tooltip>
        <TooltipLeader />
      </BarWrapper>

      {isFiltered ? (
        <FilteredLabel>{label}</FilteredLabel>
      ) : (
        <Label>{label}</Label>
      )}
    </Wrapper>
  )
}

VerticalBar.propTypes = {}

VerticalBar.propTypes = {
  isFiltered: PropTypes.bool, // true if filter is set on this bar
  isExcluded: PropTypes.bool, // true if filters are set on others but not this one
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  quantity: PropTypes.number.isRequired,
  scale: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
}

VerticalBar.defaultProps = {
  isFiltered: false,
  isExcluded: false,
}

// TODO: optimize for changes to the callback
export default memo(VerticalBar)
