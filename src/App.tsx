import { usePath } from './router'
import { Home } from './screens/Home'
import { HowItWorks } from './screens/HowItWorks'
import { Planner } from './screens/Planner'
import { Host } from './screens/Host'
import { Play } from './screens/Play'
import { Judge } from './screens/Judge'
import { Rolo } from './screens/Rolo'
import { Choose } from './screens/Choose'
import { Curadoria } from './screens/Curadoria'

export function App() {
  const path = usePath()
  const parts = path.split('/').filter(Boolean)
  switch (parts[0]) {
    case 'como-funciona':
      return <HowItWorks />
    case 'curadoria':
      return <Curadoria id={parts[1]} key={parts[1] ?? 'lista'} />
    case 'escolher':
      return <Choose mode={parts[1] ?? 'licao'} key={parts[1]} />
    case 'criar':
      return <Planner packId={parts[1]} key={parts[1] ?? 'padrao'} />
    case 'host':
      return <Host pin={parts[1] ?? ''} key={parts[1]} />
    case 'j':
      return <Play pin={parts[1] ?? ''} key={parts[1] ?? 'none'} />
    case 'f':
      return <Judge pin={parts[1] ?? ''} judgeKey={parts[2] ?? ''} />
    case 'rolo':
      return <Rolo packId={parts[1]} key={parts[1] ?? 'padrao'} />
    default:
      return <Home />
  }
}
