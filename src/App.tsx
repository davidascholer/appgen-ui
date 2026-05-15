import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Plus, DownloadSimple, List, X, House, Trash } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface NavLink {
  id: string
  title: string
  link: string
  icon: string
}

interface AppConfig {
  id: string
  components: {
    navigationDrawer: {
      shown: boolean
      items: NavLink[]
    }
  }
}

type DrawerState = 'closed' | 'icons-only' | 'open'

const DEFAULT_CONFIG: AppConfig = {
  id: crypto.randomUUID(),
  components: {
    navigationDrawer: {
      shown: false,
      items: []
    }
  }
}

function App() {
  const [config, setConfig] = useKV<AppConfig>('app-config', DEFAULT_CONFIG)
  const [drawerState, setDrawerState] = useState<DrawerState>('closed')
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  const safeConfig = config || DEFAULT_CONFIG

  const toggleNavigationDrawer = () => {
    setConfig((current) => {
      const base = current || DEFAULT_CONFIG
      return {
        ...base,
        components: {
          ...base.components,
          navigationDrawer: {
            ...base.components.navigationDrawer,
            shown: !base.components.navigationDrawer.shown
          }
        }
      }
    })
    if (safeConfig.components.navigationDrawer.shown) {
      setDrawerState('closed')
    }
  }

  const addNavigationLink = () => {
    if (!newLinkTitle.trim()) {
      toast.error('Please enter a title')
      return
    }
    
    const newLink: NavLink = {
      id: crypto.randomUUID(),
      title: newLinkTitle.trim(),
      link: newLinkUrl.trim() || '#',
      icon: 'House'
    }

    setConfig((current) => {
      const base = current || DEFAULT_CONFIG
      return {
        ...base,
        components: {
          ...base.components,
          navigationDrawer: {
            ...base.components.navigationDrawer,
            items: [...base.components.navigationDrawer.items, newLink]
          }
        }
      }
    })

    setNewLinkTitle('')
    setNewLinkUrl('')
    toast.success('Link added')
  }

  const removeNavigationLink = (id: string) => {
    setConfig((current) => {
      const base = current || DEFAULT_CONFIG
      return {
        ...base,
        components: {
          ...base.components,
          navigationDrawer: {
            ...base.components.navigationDrawer,
            items: base.components.navigationDrawer.items.filter(item => item.id !== id)
          }
        }
      }
    })
    toast.success('Link removed')
  }

  const cycleDrawerState = () => {
    if (!safeConfig.components.navigationDrawer.shown) return
    
    if (drawerState === 'closed') {
      setDrawerState('icons-only')
    } else if (drawerState === 'icons-only') {
      setDrawerState('open')
    } else {
      setDrawerState('closed')
    }
  }

  const copyJsonToClipboard = () => {
    const json = JSON.stringify(safeConfig, null, 2)
    navigator.clipboard.writeText(json)
    toast.success('JSON copied to clipboard')
  }

  const drawerWidth = drawerState === 'open' ? 240 : drawerState === 'icons-only' ? 60 : 0

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Component Builder</h1>
          
          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <DownloadSimple size={18} weight="bold" />
                Export
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle className="font-mono">Export Configuration</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <pre className="bg-secondary p-4 rounded-lg overflow-auto text-sm font-mono max-h-[60vh]">
                  {JSON.stringify(safeConfig, null, 2)}
                </pre>
                <Button onClick={copyJsonToClipboard} className="w-full">
                  Copy to Clipboard
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4 font-mono">Features</h2>
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              <Button
                variant={safeConfig.components.navigationDrawer.shown ? "default" : "outline"}
                className={safeConfig.components.navigationDrawer.shown ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}
                onClick={toggleNavigationDrawer}
              >
                Add Navigation
              </Button>
            </div>
          </ScrollArea>
        </Card>

        <AnimatePresence>
          {safeConfig.components.navigationDrawer.shown && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-4">
                <h2 className="text-lg font-semibold mb-4 font-mono">Navigation Links</h2>
                
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="link-title">Title</Label>
                      <Input
                        id="link-title"
                        placeholder="Home"
                        value={newLinkTitle}
                        onChange={(e) => setNewLinkTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addNavigationLink()}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="link-url">Link</Label>
                      <Input
                        id="link-url"
                        placeholder="/home"
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addNavigationLink()}
                      />
                    </div>
                  </div>
                  
                  <Button onClick={addNavigationLink} className="w-full gap-2">
                    <Plus size={18} weight="bold" />
                    Add Link
                  </Button>

                  {safeConfig.components.navigationDrawer.items.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        {safeConfig.components.navigationDrawer.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <House size={20} className="text-muted-foreground flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium truncate">{item.title}</p>
                                <p className="text-sm text-muted-foreground truncate">{item.link}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeNavigationLink(item.id)}
                              className="flex-shrink-0 text-destructive hover:text-destructive"
                            >
                              <Trash size={18} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 font-mono">Preview</h2>
          
          <div className="relative border-2 border-border rounded-lg overflow-hidden bg-card min-h-[400px]">
            <AnimatePresence>
              {safeConfig.components.navigationDrawer.shown && (
                <motion.div
                  className="absolute top-0 left-0 h-full bg-secondary border-r border-border flex flex-col z-10"
                  initial={{ width: 0 }}
                  animate={{ width: drawerWidth }}
                  exit={{ width: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  {drawerState !== 'closed' && (
                    <div className="flex flex-col h-full overflow-hidden">
                      <div className="p-4 flex-shrink-0">
                        {drawerState === 'open' && (
                          <motion.h3
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="font-semibold text-sm"
                          >
                            Navigation
                          </motion.h3>
                        )}
                      </div>
                      
                      <ScrollArea className="flex-1">
                        <div className="space-y-1 px-2 pb-4">
                          {safeConfig.components.navigationDrawer.items.length === 0 ? (
                            <div className="text-center py-8 px-4">
                              {drawerState === 'open' && (
                                <p className="text-sm text-muted-foreground">
                                  No links added yet
                                </p>
                              )}
                            </div>
                          ) : (
                            safeConfig.components.navigationDrawer.items.map((item) => (
                              <motion.div
                                key={item.id}
                                className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <House size={20} className="flex-shrink-0" />
                                {drawerState === 'open' && (
                                  <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-sm truncate"
                                  >
                                    {item.title}
                                  </motion.span>
                                )}
                              </motion.div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              className="h-full flex items-start p-6"
              animate={{ paddingLeft: safeConfig.components.navigationDrawer.shown ? drawerWidth + 24 : 24 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <div className="w-full">
                {safeConfig.components.navigationDrawer.shown && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={cycleDrawerState}
                    className="mb-4"
                  >
                    <motion.div
                      animate={{ rotate: drawerState === 'closed' ? 0 : 90 }}
                      transition={{ duration: 0.2 }}
                    >
                      {drawerState === 'closed' ? (
                        <List size={24} weight="bold" />
                      ) : (
                        <X size={24} weight="bold" />
                      )}
                    </motion.div>
                  </Button>
                )}
                
                {!safeConfig.components.navigationDrawer.shown && (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <p>Add features to see the preview</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default App
