import React from "react";
import { Chip, ListItem, Typography } from "@jahia/moonstone";
import type { SearchHit } from "./searchQuery.ts";

type ResultCardProps = {
  hit: SearchHit;
};

const MAX_NAME_LENGTH = 80;

export const ResultCard = ({ hit }: ResultCardProps) => {
  const name =
    hit.displayableName.length > MAX_NAME_LENGTH
      ? hit.displayableName.slice(0, MAX_NAME_LENGTH) + "…"
      : hit.displayableName;

  return (
    <ListItem
      label={
        <div>
          <Typography variant="subHeading">{name}</Typography>
          {hit.excerpt && (
            <Typography variant="body">
              <span dangerouslySetInnerHTML={{ __html: hit.excerpt }} />
            </Typography>
          )}
        </div>
      }
      description={hit.path}
      iconStart={<Chip color="accent" label={hit.nodeType} />}
      typographyVariant="caption"
    />
  );
};
