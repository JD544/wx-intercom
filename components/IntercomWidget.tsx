import Intercom, { shutdown } from "@intercom/messenger-js-sdk";
import useStorage from "../../../../func/hooks/useStorage";
import { User } from "../../../../types/types";
import { useEffect } from "react";

/**
 * A component that initializes the Intercom messenger.
 *
 * @remarks
 * This component initializes the Intercom messenger and passes the user's
 * information to the Intercom service. The user's information is retrieved from
 * the local storage and must be in the format of a JSON object with the following
 * keys: `firstName`, `lastName`, `email`, `companyName`.
 *
 * @param {string} appId - The Intercom app ID.
 * @param {User} user - The user object.
 */
export default function IntercomWidget() {
    const { getState } = useStorage();
    const appId = getState('Intercom for Wx')?.intercomConfig.appId;
    const intercomConfig = getState('Intercom for Wx')?.intercomConfig;
    const user = JSON.parse(localStorage.getItem("wx-auth-user") || "{}") as User;

    const logoutFromIntercom = () => {            
        // Step 1: End current session
        shutdown();

        // Step 2: Clear stored Intercom data
        Object.keys(localStorage).forEach((key) => {
            if (key.startsWith("intercom")) {
            localStorage.removeItem(key);
            }
        });

        document.cookie.split(";").forEach((cookie) => {
            const name = cookie.split("=")[0].trim();
            if (name.startsWith("intercom")) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
            }
        });
    }

    useEffect(() => {      
        if (!appId) return;

        if (user?.email)
        {
            Intercom({
                app_id: appId,
                name: `${user.firstName} ${user?.lastName || ''}`,
                email: user.email,
                // Configuration for the Intercom widget
                alignment: intercomConfig.alignment,                
                vertical_padding: intercomConfig.verticalPadding,
                background_color: intercomConfig.customColors.background,
                horizontal_padding: intercomConfig.horizontalPadding,
                hide_default_launcher: intercomConfig.hideDefaultLauncher,                            
            })
        }
        else {
            Intercom({
                app_id: appId,
                // Configuration for the Intercom widget
                alignment: intercomConfig.alignment,                
                vertical_padding: intercomConfig.verticalPadding,
                background_color: intercomConfig.customColors.background,
                horizontal_padding: intercomConfig.horizontalPadding,
                hide_default_launcher: intercomConfig.hideDefaultLauncher,            
            })
        }

        return () => {
            logoutFromIntercom();
        }
    }, [intercomConfig])

  return (
    <></>
  )
}
