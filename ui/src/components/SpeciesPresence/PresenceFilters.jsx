import React from 'react'
import PropTypes from 'prop-types'
import { Box } from 'theme-ui'

import FiltersList from 'components/FiltersList'
import { SidebarHeader } from 'components/Sidebar'
import { ExpandableParagraph } from 'components/Text'

const PresenceFilters = ({ filters }) => (
  <>
    <Box flex="0 0 auto">
      <SidebarHeader title="Species Occurrences" />

      <ExpandableParagraph
        sx={{
          px: '1rem',
          '& p': {
            fontSize: 2,
            color: 'grey.8',
            lineHeight: 1.3,
          },
        }}
        snippet="An occurrence is anytime a species was detected by an acoustic
                detector at a given location during a given night. Use the
                following filters to ..."
      >
        An occurrence is anytime a species was detected by an acoustic detector
        at a given location for a given month and year. Use the following
        filters to select specific species or time periods that you are
        interested in.
        <br />
        <br />
        You can combine filters and use multiple values for each filter. For
        example, you can select Fringed Bat in March and April.
      </ExpandableParagraph>
    </Box>

    <FiltersList filters={filters} />
  </>
)

PresenceFilters.propTypes = {
  // validated by FiltersList
  filters: PropTypes.array.isRequired,
}

export default PresenceFilters
