import { faIntercom } from '@fortawesome/free-brands-svg-icons'
import { BuilderComponent } from '../../../func/builder'
import { Plugin } from '../plugins'
import './main.css'
import IntercomDashboard from './ui'
import { useEffect } from 'react'
import { useBuilder } from '../../../func/hooks/useBuilder'

interface IntercomProps {
    settings: Plugin
}

const IntercomWidget: BuilderComponent = {
  type: 'plugin',
  pluginName: 'Intercom for Wx',
  content: 'Intercom Widget',
  plugin: 'intercom__01',
  id: 'wx-intercom',
  icon: faIntercom
}

export default function Intercom({ settings }: IntercomProps) {
  const { addAvailableComponent } = useBuilder();
  useEffect(() => {
    addAvailableComponent([IntercomWidget], 'Intercom for Wx')
  }, [])
  return (
      <div className="popout dialog site__editor dialog__full __tool__edit web__editor__dialog Intercom-for-Wx">
      <div className="dialog__body">
          <div className="dialog__header">
            <h3 className="dialog__title">Intercom for Wx</h3>
          </div>
          <div className="dialog__content">
            <div className="dialog__body">
              <div className="auth__management__container">
                <IntercomDashboard pluginSettings={settings} />
              </div>
          </div>
      </div>      
    </div>
    </div>
  )
}
