import { useEffect, useState } from 'react';
import useStorage from '../../../func/hooks/useStorage';
import { Plugin } from '../plugins';
import { usePluginApi } from '../../../func/hooks/useWxpluginAPI';
import Intercom, { shutdown } from '@intercom/messenger-js-sdk';
import { User } from '../../../types/types';

interface IntercomConfig {
  appId: string;
  isEnabled: boolean;
  customLauncher: boolean;
  hideDefaultLauncher: boolean;
  showOnAllPages: boolean;
  alignment: 'left' | 'right';
  verticalPadding: number;
  horizontalPadding: number;
  customColors: {
    primary: string;
    background: string;
    text: string;
  };
  welcomeMessage: string;
  companyName: string;
  apiBase: string;
}

const IntercomDashboard = ({ pluginSettings }: { pluginSettings: Plugin }) => {
  const { putItemInStore, getState } = useStorage();
  const { registerPlugin } = usePluginApi();
  const [activeSection, setActiveSection] = useState<string>('settings');
  
  const [intercomConfig, setIntercomConfig] = useState<IntercomConfig>(getState(pluginSettings.name)?.intercomConfig || {
    appId: '',
    isEnabled: false,
    customLauncher: false,
    hideDefaultLauncher: false,
    alignment: 'right',
    verticalPadding: 20,
    horizontalPadding: 20,
    customColors: {
      primary: '#007aff',
      background: '#ffffff',
      text: '#000000'
    },
    welcomeMessage: 'Hi! How can we help you today?',
    companyName: 'Your Company',
    apiBase: 'https://widget.intercom.io',
  });
  // Generate Intercom widget script
  const generateIntercomScript = () => {
    if (!intercomConfig.appId) return '';
    
    return `
      window.intercomSettings = {
        app_id: "${intercomConfig.appId}",
        name: "User Name", // Replace with actual user data
        email: "user@example.com", // Replace with actual user data
        company: {
          name: "${intercomConfig.companyName}"
        },
        custom_launcher_selector: ${intercomConfig.customLauncher ? '".intercom-launcher"' : 'null'},
        hide_default_launcher: ${intercomConfig.hideDefaultLauncher},
        alignment: "${intercomConfig.alignment}",
        vertical_padding: ${intercomConfig.verticalPadding},
        horizontal_padding: ${intercomConfig.horizontalPadding},
        background: {
          color: "${intercomConfig.customColors.primary}"
        }
      };
      
      (function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic('reattach_activator');ic('update',w.intercomSettings);}else{var d=document;var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;var l=function(){var s=d.createElement('script');s.type='text/javascript';s.async=true;s.src='https://widget.intercom.io/widget/${intercomConfig.appId}';var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);};if(document.readyState==='complete'){l();}else if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}})();
    `;
  };

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
    const config = {
      intercomConfig: intercomConfig
    };

    putItemInStore(pluginSettings.name, config);
   
        if (!intercomConfig.appId) return;

        const user = JSON.parse(localStorage.getItem("wx-auth-user") || "{}") as User;

        if (!intercomConfig.showOnAllPages) return;
        
        if (user?.email)
        {
            Intercom({
                app_id: intercomConfig.appId,
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
                app_id: intercomConfig.appId,
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
  }, [intercomConfig]);

  useEffect(() => {
    registerPlugin('wx-intercom', [
      {
        name: 'getConfig',
        description: 'Returns the Intercom configuration',
        method: () => intercomConfig
      },
      {
        name: 'getScript',
        description: 'Returns the Intercom widget script',
        method: () => generateIntercomScript()
      },
      {
        name: 'updateConfig',
        description: 'Updates Intercom configuration',
        method: (newConfig: Partial<IntercomConfig>) => {
          setIntercomConfig(prev => ({ ...prev, ...newConfig }));
        }
      }
    ], null);
  }, [intercomConfig]);

  const handleConfigToggle = (key: keyof IntercomConfig): void => {
    setIntercomConfig(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const renderContent = () => {
    switch (activeSection) {

      case 'widget':
        return (
          <div className="wx-intercom-card">
            <h2 className="wx-intercom-section-title">Widget Customization</h2>
            
            <div className="wx-intercom-setting-item">
              <div>
                <h3 className="wx-intercom-setting-title">Custom Launcher</h3>
                <p className="wx-intercom-setting-description">Use a custom button instead of the default Intercom launcher</p>
              </div>
              <div 
                className={`wx-intercom-toggle ${intercomConfig.customLauncher ? 'active' : 'inactive'}`}
                onClick={() => handleConfigToggle('customLauncher')}
              >
                <div className={`wx-intercom-toggle-handle ${intercomConfig.customLauncher ? 'active' : 'inactive'}`} />
              </div>
            </div>

            <div className="wx-intercom-setting-item">
              <div>
                <h3 className="wx-intercom-setting-title">Hide Default Launcher</h3>
                <p className="wx-intercom-setting-description">Hide Intercom's default messenger launcher</p>
              </div>
              <div 
                className={`wx-intercom-toggle ${intercomConfig.hideDefaultLauncher ? 'active' : 'inactive'}`}
                onClick={() => handleConfigToggle('hideDefaultLauncher')}
              >
                <div className={`wx-intercom-toggle-handle ${intercomConfig.hideDefaultLauncher ? 'active' : 'inactive'}`} />
              </div>
              <div className="wx-intercom-setting-item">
                <div>
                  <h3 className="wx-intercom-setting-title">Enable Globally</h3>
                  <p className="wx-intercom-setting-description">Enable Intercom for all pages on your website</p>
                </div>
                <div 
                  className={`wx-intercom-toggle ${intercomConfig.showOnAllPages ? 'active' : 'inactive'}`}
                  onClick={() => handleConfigToggle('showOnAllPages')}
                >
                  <div className={`wx-intercom-toggle-handle ${intercomConfig.showOnAllPages ? 'active' : 'inactive'}`} />
                </div>
              </div>
            </div>

            <div className="wx-intercom-settings-form">
              <div className="wx-intercom-field">
                <label className="wx-intercom-label">Widget Alignment</label>
                <select 
                  className="wx-intercom-input"
                  value={intercomConfig.alignment}
                  onChange={(e) => setIntercomConfig(prev => ({...prev, alignment: e.target.value as 'left' | 'right'}))}
                >
                  <option value="right">Right</option>
                  <option value="left">Left</option>
                </select>
              </div>

              <div className="wx-intercom-field-group">
                <div className="wx-intercom-field">
                  <label className="wx-intercom-label">Vertical Padding (px)</label>
                  <input 
                    type="number"
                    className="wx-intercom-input"
                    value={intercomConfig.verticalPadding}
                    onChange={(e) => setIntercomConfig(prev => ({...prev, verticalPadding: parseInt(e.target.value)}))}
                  />
                </div>

                <div className="wx-intercom-field">
                  <label className="wx-intercom-label">Horizontal Padding (px)</label>
                  <input 
                    type="number"
                    className="wx-intercom-input"
                    value={intercomConfig.horizontalPadding}
                    onChange={(e) => setIntercomConfig(prev => ({...prev, horizontalPadding: parseInt(e.target.value)}))}
                  />
                </div>
              </div>

              <div className="wx-intercom-color-section">
                <h3 className="wx-intercom-subsection-title">Custom Colors</h3>
                <div className="wx-intercom-color-grid">
                  <div className="wx-intercom-field">
                    <label className="wx-intercom-label">Primary Color</label>
                    <input 
                      type="color"
                      className="wx-intercom-color-input"
                      value={intercomConfig.customColors.primary}
                      onChange={(e) => setIntercomConfig(prev => ({
                        ...prev, 
                        customColors: {...prev.customColors, primary: e.target.value}
                      }))}
                    />
                  </div>
                  <div className="wx-intercom-field">
                    <label className="wx-intercom-label">Background Color</label>
                    <input 
                      type="color"
                      className="wx-intercom-color-input"
                      value={intercomConfig.customColors.background}
                      onChange={(e) => setIntercomConfig(prev => ({
                        ...prev, 
                        customColors: {...prev.customColors, background: e.target.value}
                      }))}
                    />
                  </div>
                  <div className="wx-intercom-field">
                    <label className="wx-intercom-label">Text Color</label>
                    <input 
                      type="color"
                      className="wx-intercom-color-input"
                      value={intercomConfig.customColors.text}
                      onChange={(e) => setIntercomConfig(prev => ({
                        ...prev, 
                        customColors: {...prev.customColors, text: e.target.value}
                      }))}
                    />
                  </div>
                </div>
              </div>

              <div className="wx-intercom-field">
                <label className="wx-intercom-label">Welcome Message</label>
                <textarea 
                  className="wx-intercom-input wx-intercom-textarea"
                  value={intercomConfig.welcomeMessage}
                  onChange={(e) => setIntercomConfig(prev => ({...prev, welcomeMessage: e.target.value}))}
                  placeholder="Enter welcome message for visitors..."
                />
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="wx-intercom-card">
            {!intercomConfig.appId && (
              <div className="wx-intercom-alert wx-intercom-alert-warning">
                Please configure your Intercom App ID in Settings to start using the widget.
              </div>
            )}
            <h2 className="wx-intercom-section-title">Intercom Settings</h2>
            
            <div className="wx-intercom-connection-section">
              <h3 className="wx-intercom-subsection-title">Connection Settings</h3>
              
              <div className="wx-intercom-settings-form">
                <div className="wx-intercom-field">
                  <label className="wx-intercom-label">Intercom App ID</label>
                  <input 
                    type="text"
                    className="wx-intercom-input"
                    value={intercomConfig.appId}
                    onChange={(e) => setIntercomConfig(prev => ({...prev, appId: e.target.value}))}
                    placeholder="Enter your Intercom App ID"
                  />
                  <small className="wx-intercom-field-hint">
                    Find your App ID in your Intercom settings under Installation
                  </small>
                </div>

                <div className="wx-intercom-field">
                  <label className="wx-intercom-label">Company Name</label>
                  <input 
                    type="text"
                    className="wx-intercom-input"
                    value={intercomConfig.companyName}
                    onChange={(e) => setIntercomConfig(prev => ({...prev, companyName: e.target.value}))}
                    placeholder="Your company name"
                  />
                </div>
              </div>

              <div className="wx-intercom-actions">
                <button 
                  className="wx-intercom-button wx-intercom-button-secondary"
                //   onClick={() => setModal({
                //     isOpen: true,
                //     title: 'Test Connection',
                //     content: <TestConnectionForm onSubmit={testConnection} onClose={CloseModal} />
                //   })}
                  disabled={!intercomConfig.appId}
                >
                  Test Connection
                </button>
              </div>
            </div>

            <div className="wx-intercom-code-section">
              <h3 className="wx-intercom-subsection-title">Installation Code</h3>
              <p className="wx-intercom-text-secondary">Copy this code to manually install Intercom on your website:</p>
              <pre className="wx-intercom-code-block">
                <code>{generateIntercomScript() || 'Configure your App ID to generate installation code'}</code>
              </pre>
              <button 
                className="wx-intercom-button wx-intercom-button-secondary"
                onClick={() => navigator.clipboard.writeText(generateIntercomScript())}
                disabled={!intercomConfig.appId}
              >
                Copy Code
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="wx-intercom-container">
      <div className="wx-intercom-topbar">
        <h1 className="wx-intercom-title">Intercom for Wx</h1>
        <div className="wx-intercom-topbar-actions">
          <a 
            href="https://developers.intercom.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="wx-intercom-button wx-intercom-button-secondary"
          >
            Documentation
          </a>
        </div>
      </div>

      <div className="wx-intercom-content">
        <div className="wx-intercom-sidebar">
          <nav className="wx-intercom-menu">
            <div
              className={`wx-intercom-menu-item ${activeSection === 'conversations' ? 'active' : ''}`}
              onClick={() => window.open('https://app.intercom.io/a/apps', '_blank')}
            >
              Conversations
            </div>
            <div
              className={`wx-intercom-menu-item ${activeSection === 'widget' ? 'active' : ''}`}
              onClick={() => setActiveSection('widget')}
            >
              Widget
            </div>
            <div
              className={`wx-intercom-menu-item ${activeSection === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveSection('settings')}
            >
              Settings
            </div>
          </nav>
        </div>

        <main className="wx-intercom-main">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default IntercomDashboard;