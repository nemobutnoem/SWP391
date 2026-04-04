import React, { createContext, useContext } from "react";

export const TeamContext = createContext(null);

export function useTeamContext() {
  return useContext(TeamContext);
}
