import { ApiClient } from "@/services/ApiClient";
import { createContext, useContext } from "react";

const apiClient: ApiClient = new ApiClient();

const ApiContext = createContext(apiClient);

export const ApiProvider = ({children}: {children: React.ReactNode}) => {
    return  (
        <ApiContext.Provider value={apiClient}>
            {children}
        </ApiContext.Provider>
    )
}

export const useApi = () => useContext(ApiContext);