import { usePath } from './router'
import { Home } from './screens/Home'
import { HowItWorks } from './screens/HowItWorks'
import { Planner } from './screens/Planner'
import { Host } from './screens/Host'
import { Play } from './screens/Play'
import { Judge } from './screens/Judge'
import { Rolo } from './screens/Rolo'

export function App() {
  const path = usePath()
  const parts = path.split('/').filter(Boolean)
  switch (parts[0]) {
    case 'como-funciona':
      return <HowItWorks />
    case 'criar':
      return <Planner />
    case 'host':
      return <Host pin={parts[1] ?? ''} key={parts[1]} />
    case 'j':
      return <Play pin={parts[1] ?? ''} key={parts[1] ?? 'none'} />
    case 'f':
      return <Judge pin={parts[1] ?? ''} judgeKey={parts[2] ?? ''} />
    case 'rolo':
      return <Rolo />
    default:
      return <Home />
  }
}
