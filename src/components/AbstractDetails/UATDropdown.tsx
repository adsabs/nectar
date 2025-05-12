import { useColorModeColors } from '@/lib/useColorModeColors';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { usePopper, VStack, Tooltip, Box, UnorderedList, ListItem } from '@chakra-ui/react';
import axios from 'axios';
import { useSelect } from 'downshift';
import { useEffect, useState } from 'react';
import { SearchQueryLink } from '../SearchQueryLink';

export type UATTermItem = {
  type: 'item';
  label: string;
  value: string;
};

export type UATTermGroup = {
  type: 'group';
  label: string;
};

export type UATTermOption = UATTermItem | UATTermGroup;

const isUATGroup = (item: UATTermOption): item is UATTermGroup => item.type === 'group';

const UAT_ENDPOINT = 'http://vocabs.ardc.edu.au/repository/api/sparql/aas_the-unified-astronomy-thesaurus_5-1-0';

interface IRelatedKeywords {
  relation: 'child' | 'parent' | 'related';
  label: string;
  uri: string;
  value: string;
}

export const UATDropdown = ({ keyword }: { keyword: string }) => {
  // TODO: fetch keyword parents and childrens on isOpen
  // TODO: use useQuery to cache

  const [uri, setUri] = useState<string>(null);
  const [keywords, setKeywords] = useState<IRelatedKeywords[]>([]);

  useEffect(() => {
    const fetchKeyword = async () => {
      const query = `
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
        SELECT ?concept ?label WHERE {
        ?concept skos:prefLabel ?label .
        FILTER (LANG(?label) = "en")
        FILTER (LCASE(STR(?label)) = "${keyword}")
      }
      `;

      const url = `${UAT_ENDPOINT}?query=${encodeURIComponent(query)}`;
      try {
        const response = await axios.get(url, {
          headers: {
            Accept: 'application/sparql-results+json',
          },
        });
        setUri(response.data.results.bindings[0]?.concept?.value);
      } catch (error) {
        console.error('Error fetching UAT data:', error);
      }
    };
    fetchKeyword();
  }, [keyword]);

  useEffect(() => {
    if (uri !== null) {
      const fetchUAT = async () => {
        const query = `
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
        SELECT * WHERE {
          ?concept a skos:Concept .
          VALUES ?concept {<${uri}>}

          {
            ?concept skos:broader ?relatedConcept .
            BIND("parent" AS ?relationType)
          }
          UNION
          {
            ?concept skos:narrower ?relatedConcept .
            BIND("child" AS ?relationType)
          }
          UNION
          {
            ?concept skos:related ?relatedConcept .
            BIND("related" AS ?relationType)
          }

          ?relatedConcept skos:prefLabel ?label .
          FILTER (lang(?label) = "en")
        }
        ORDER BY ?relationType ?label
      `;

        const url = `${UAT_ENDPOINT}?query=${encodeURIComponent(query)}`;
        try {
          const response = await axios.get(url, {
            headers: {
              Accept: 'application/sparql-results+json',
            },
          });
          setKeywords(
            response.data.results.bindings.map((d) => ({
              relation: d.relationType.value,
              label: d.label.value,
              uri: d.relatedConcept.value,
              value: d.label.value,
            })),
          );
        } catch (error) {
          console.error('Error fetching UAT data:', error);
        }
      };

      fetchUAT();
    }
  }, [uri]);

  const parents = keywords
    .filter((r) => r.relation === 'parent')
    .map((n) => ({ type: 'item', label: n.label, value: n.label } as UATTermItem));
  const children = keywords
    .filter((r) => r.relation === 'child')
    .map((n) => ({ type: 'item', label: n.label, value: n.label } as UATTermItem));
  const related = keywords
    .filter((r) => r.relation === 'related')
    .map((n) => ({ type: 'item', label: n.label, value: n.label } as UATTermItem));

  const items: UATTermOption[] = [
    { type: 'group', label: `Broader (${parents.length})` } as UATTermGroup,
    ...parents,
    { type: 'group', label: `Narrower  (${children.length})` } as UATTermGroup,
    ...children,
    { type: 'group', label: `Related  (${related.length})` } as UATTermGroup,
    ...related,
  ];

  const { isOpen, getToggleButtonProps, getMenuProps, highlightedIndex, getItemProps } = useSelect({
    items,
    itemToString: (item) => item.label,
  });
  const { popperRef: dropdownPopperRef, referenceRef: dropdownReferenceRef } = usePopper({
    placement: 'right-start',
  });
  const colors = useColorModeColors();

  return (
    <VStack>
      <Tooltip label="related keywords">
        <Box
          variant="unstyled"
          {...getToggleButtonProps({
            ref: (el: HTMLInputElement) => {
              dropdownReferenceRef(el);
              return el;
            },
          })}
          m={1}
          cursor="pointer"
          tabIndex={0}
        >
          <ChevronDownIcon aria-label="Related keywords" boxSize={4} />
        </Box>
      </Tooltip>
      <UnorderedList
        zIndex={10}
        bgColor={colors.background}
        border={isOpen && items.length > 0 ? '1px' : 'none'}
        borderRadius={5}
        borderColor="gray.200"
        boxShadow="lg"
        maxHeight="500px"
        w="fit-content"
        maxW="400px"
        overflowY="scroll"
        {...getMenuProps({
          ref: (el: HTMLUListElement) => {
            dropdownPopperRef(el);
            return el;
          },
        })}
      >
        {isOpen &&
          items.map((term, index) => (
            <ListItem
              key={`${term}-${index}`}
              fontWeight={isUATGroup(term) ? 'bold' : 'normal'}
              color={
                isUATGroup(term) ? 'gray.300' : highlightedIndex === index ? colors.highlightForeground : colors.text
              }
              backgroundColor={highlightedIndex === index ? colors.highlightBackground : 'auto'}
              p={2}
              pl={isUATGroup(term) ? 2 : 4}
              cursor={isUATGroup(term) ? 'default' : 'pointer'}
              {...getItemProps({
                item: term,
                index,
                disabled: isUATGroup(term),
              })}
            >
              {isUATGroup(term) ? (
                <>{term.label}</>
              ) : (
                <SearchQueryLink params={{ q: `uat:"${term.value}"` }} textDecoration="none" color="inherit">
                  {term.label}
                </SearchQueryLink>
              )}
            </ListItem>
          ))}
      </UnorderedList>
    </VStack>
  );
};
