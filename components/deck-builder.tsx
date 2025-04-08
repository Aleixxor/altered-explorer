"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CardDetailsModal } from "@/components/card-details-modal"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Trash2, PlusCircle, Download, Search, FilterX } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CardData {
  mainFaction: string
  name: string
  rarity: string
  cardType: string
  cardSubTypes: string
  mainCost: string
  recallCost: string
  oceanPower: string
  forestPower: string
  mountainPower: string
  mainEffect: string
  echoEffect: string
  cardSet: string
  cardSetReference: string
  imagePath: string
  qrUrlDetail: string
  reference: string
}

interface DeckCard extends CardData {
  quantity: number
}

interface Deck {
  id: string
  name: string
  cards: DeckCard[]
}

export function DeckBuilder() {
  const [cards, setCards] = useState<CardData[]>([])
  const [filteredCards, setFilteredCards] = useState<CardData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Deck states
  const [decks, setDecks] = useState<Deck[]>([])
  const [currentDeck, setCurrentDeck] = useState<Deck | null>(null)
  const [newDeckName, setNewDeckName] = useState("")

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [faction, setFaction] = useState<string>("")
  const [rarity, setRarity] = useState<string>("")
  const [cardType, setCardType] = useState<string>("")

  // Unique values for filters
  const [factions, setFactions] = useState<string[]>([])
  const [rarities, setRarities] = useState<string[]>([])
  const [cardTypes, setCardTypes] = useState<string[]>([])

  const { toast } = useToast()

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await fetch("/api/cards")
        if (!response.ok) {
          throw new Error("Failed to fetch cards")
        }
        const data = await response.json()
        setCards(data)
        setFilteredCards(data)

        // Extract unique values for filters
        setFactions([...new Set(data.map((card: CardData) => card.mainFaction))])
        setRarities([...new Set(data.map((card: CardData) => card.rarity))])
        setCardTypes([...new Set(data.map((card: CardData) => card.cardType))])

        setLoading(false)
      } catch (error) {
        console.error("Error fetching cards:", error)
        setLoading(false)
      }
    }

    fetchCards()

    // Load saved decks from localStorage
    const savedDecks = localStorage.getItem("alteredTcgDecks")
    if (savedDecks) {
      setDecks(JSON.parse(savedDecks))
    }
  }, [])

  useEffect(() => {
    // Apply filters
    let result = cards

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (card) =>
          card.name.toLowerCase().includes(term) ||
          card.mainEffect?.toLowerCase().includes(term) ||
          card.echoEffect?.toLowerCase().includes(term),
      )
    }

    if (faction && faction !== "all") {
      result = result.filter((card) => card.mainFaction === faction)
    }

    if (rarity && rarity !== "all") {
      result = result.filter((card) => card.rarity === rarity)
    }

    if (cardType && cardType !== "all") {
      result = result.filter((card) => card.cardType === cardType)
    }

    setFilteredCards(result)
  }, [cards, searchTerm, faction, rarity, cardType])

  // Save decks to localStorage whenever they change
  useEffect(() => {
    if (decks.length > 0) {
      localStorage.setItem("alteredTcgDecks", JSON.stringify(decks))
    }
  }, [decks])

  const handleCardClick = (card: CardData) => {
    setSelectedCard(card)
    setIsModalOpen(true)
  }

  const resetFilters = () => {
    setSearchTerm("")
    setFaction("")
    setRarity("")
    setCardType("")
  }

  const createNewDeck = () => {
    if (!newDeckName.trim()) {
      toast({
        title: "Invalid name",
        description: "Please enter a name for your deck.",
        variant: "destructive",
      })
      return
    }

    const newDeck: Deck = {
      id: Date.now().toString(),
      name: newDeckName,
      cards: [],
    }

    setDecks([...decks, newDeck])
    setCurrentDeck(newDeck)
    setNewDeckName("")

    toast({
      title: "Deck created",
      description: `The deck "${newDeckName}" has been created successfully.`,
    })
  }

  const selectDeck = (deckId: string) => {
    const deck = decks.find((d) => d.id === deckId)
    if (deck) {
      setCurrentDeck(deck)
    }
  }

  const deleteDeck = (deckId: string) => {
    const updatedDecks = decks.filter((d) => d.id !== deckId)
    setDecks(updatedDecks)

    if (currentDeck && currentDeck.id === deckId) {
      setCurrentDeck(updatedDecks.length > 0 ? updatedDecks[0] : null)
    }

    toast({
      title: "Deck deleted",
      description: "The deck has been deleted successfully.",
    })
  }

  const addCardToDeck = (card: CardData) => {
    if (!currentDeck) {
      toast({
        title: "No deck selected",
        description: "Please select or create a deck first.",
        variant: "destructive",
      })
      return
    }

    const updatedDecks = decks.map((deck) => {
      if (deck.id === currentDeck.id) {
        const existingCard = deck.cards.find((c) => c.reference === card.reference)

        if (existingCard) {
          // Card already exists, increase quantity
          return {
            ...deck,
            cards: deck.cards.map((c) => (c.reference === card.reference ? { ...c, quantity: c.quantity + 1 } : c)),
          }
        } else {
          // Add new card
          return {
            ...deck,
            cards: [...deck.cards, { ...card, quantity: 1 }],
          }
        }
      }
      return deck
    })

    setDecks(updatedDecks)
    setCurrentDeck(updatedDecks.find((d) => d.id === currentDeck.id) || null)

    toast({
      title: "Card added",
      description: `${card.name} has been added to the "${currentDeck.name}" deck.`,
    })
  }

  const removeCardFromDeck = (cardReference: string) => {
    if (!currentDeck) return

    const updatedDecks = decks.map((deck) => {
      if (deck.id === currentDeck.id) {
        const existingCard = deck.cards.find((c) => c.reference === cardReference)

        if (existingCard && existingCard.quantity > 1) {
          // Decrease quantity
          return {
            ...deck,
            cards: deck.cards.map((c) => (c.reference === cardReference ? { ...c, quantity: c.quantity - 1 } : c)),
          }
        } else {
          // Remove card
          return {
            ...deck,
            cards: deck.cards.filter((c) => c.reference !== cardReference),
          }
        }
      }
      return deck
    })

    setDecks(updatedDecks)
    setCurrentDeck(updatedDecks.find((d) => d.id === currentDeck.id) || null)
  }

  const exportDeck = () => {
    if (!currentDeck) return

    const deckData = {
      name: currentDeck.name,
      cards: currentDeck.cards.map((card) => ({
        name: card.name,
        reference: card.reference,
        quantity: card.quantity,
      })),
    }

    const dataStr = JSON.stringify(deckData, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = `${currentDeck.name.replace(/\s+/g, "_")}_deck.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const calculateDeckStats = () => {
    if (!currentDeck) return { total: 0, factions: {}, types: {}, rarities: {} }

    const stats = {
      total: currentDeck.cards.reduce((sum, card) => sum + card.quantity, 0),
      factions: {} as Record<string, number>,
      types: {} as Record<string, number>,
      rarities: {} as Record<string, number>,
    }

    currentDeck.cards.forEach((card) => {
      // Count by faction
      stats.factions[card.mainFaction] = (stats.factions[card.mainFaction] || 0) + card.quantity

      // Count by type
      stats.types[card.cardType] = (stats.types[card.cardType] || 0) + card.quantity

      // Count by rarity
      stats.rarities[card.rarity] = (stats.rarities[card.rarity] || 0) + card.quantity
    })

    return stats
  }

  const deckStats = calculateDeckStats()

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-altered-cyan" />
        <span className="ml-2 text-altered-light/70">Loading cards...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="altered-card p-4">
        <div className="altered-header mb-4">
          <h2 className="text-xl font-bold altered-title">Deck Management</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="deckName" className="text-altered-light mb-1.5 block">
              New Deck Name
            </Label>
            <div className="flex space-x-2">
              <Input
                id="deckName"
                placeholder="Enter deck name"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                className="altered-input"
              />
              <Button
                onClick={createNewDeck}
                className="bg-gradient-to-r from-altered-blue to-altered-purple hover:from-altered-cyan hover:to-altered-green transition-all duration-300"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="selectDeck" className="text-altered-light mb-1.5 block">
              Select Deck
            </Label>
            <Select value={currentDeck?.id} onValueChange={selectDeck}>
              <SelectTrigger className="altered-select">
                <SelectValue placeholder="Select a deck">
                  {currentDeck ? currentDeck.name : "Select a deck"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-altered-dark border-altered-blue/50">
                {decks.map((deck) => (
                  <SelectItem key={deck.id} value={deck.id}>
                    {deck.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {currentDeck && (
          <div className="flex justify-between items-center p-3 border border-altered-blue/30 rounded-lg bg-gradient-to-r from-altered-blue/10 to-altered-purple/10">
            <div>
              <h3 className="font-medium text-altered-light">
                Current Deck: <span className="text-altered-cyan">{currentDeck.name}</span>
              </h3>
              <p className="text-sm text-altered-light/70">{deckStats.total} cards total</p>
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={exportDeck}
                className="border-altered-blue/50 hover:bg-altered-blue/20 hover:text-altered-cyan"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteDeck(currentDeck.id)}
                className="bg-red-900/50 hover:bg-red-800 border border-red-700/50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 altered-card p-4">
          <div className="altered-header mb-4">
            <h2 className="text-xl font-bold altered-title">Add Cards</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="cardSearch" className="text-altered-light mb-1.5 block">
                Search by name or effect
              </Label>
              <div className="relative">
                <Input
                  id="cardSearch"
                  placeholder="Enter card name or effect"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="altered-input pl-10"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-altered-light/50" />
              </div>
            </div>

            <div>
              <Label htmlFor="factionFilter" className="text-altered-light mb-1.5 block">
                Faction
              </Label>
              <Select value={faction} onValueChange={setFaction}>
                <SelectTrigger className="altered-select">
                  <SelectValue placeholder="Select faction" value="default" />
                </SelectTrigger>
                <SelectContent className="bg-altered-dark border-altered-blue/50">
                  <SelectItem value="all">All factions</SelectItem>
                  {factions.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="rarityFilter" className="text-altered-light mb-1.5 block">
                Rarity
              </Label>
              <Select value={rarity} onValueChange={setRarity}>
                <SelectTrigger className="altered-select">
                  <SelectValue placeholder="Select rarity" value="default" />
                </SelectTrigger>
                <SelectContent className="bg-altered-dark border-altered-blue/50">
                  <SelectItem value="all">All rarities</SelectItem>
                  {rarities.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="typeFilter" className="text-altered-light mb-1.5 block">
                Card Type
              </Label>
              <Select value={cardType} onValueChange={setCardType}>
                <SelectTrigger className="altered-select">
                  <SelectValue placeholder="Select type" value="default" />
                </SelectTrigger>
                <SelectContent className="bg-altered-dark border-altered-blue/50">
                  <SelectItem value="all">All types</SelectItem>
                  {cardTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={resetFilters}
            variant="outline"
            className="mb-4 border-altered-blue/50 hover:bg-altered-blue/20 hover:text-altered-cyan"
          >
            <FilterX className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>

          <ScrollArea className="h-[400px]">
            <div className="altered-grid">
              {filteredCards.map((card) => (
                <div key={card.reference} className="altered-card altered-glow relative group">
                  <div
                    className="aspect-[2/3] cursor-pointer overflow-hidden rounded-t-lg"
                    onClick={() => handleCardClick(card)}
                  >
                    <img
                      src={card.imagePath || "/placeholder.svg"}
                      alt={card.name}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-altered-darker/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-xs text-altered-light/90 line-clamp-2">{card.mainEffect}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 bg-gradient-to-r from-altered-blue/30 to-altered-purple/30 rounded-b-lg flex justify-between items-center">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate text-altered-light">{card.name}</p>
                      <p className="text-xs text-altered-light/70 truncate">{card.mainFaction}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 rounded-full bg-altered-blue/20 hover:bg-altered-cyan/30 text-altered-light hover:text-white"
                      onClick={() => addCardToDeck(card)}
                      disabled={!currentDeck}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="altered-card p-4">
          <div className="altered-header mb-4">
            <h2 className="text-xl font-bold altered-title">Current Deck</h2>
          </div>

          {currentDeck ? (
            <>
              <Tabs defaultValue="cards">
                <TabsList className="grid w-full grid-cols-2 mb-4 bg-altered-darker border border-altered-blue/30 rounded-lg">
                  <TabsTrigger value="cards" className="altered-tab">
                    Cards
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="altered-tab">
                    Statistics
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="cards">
                  <ScrollArea className="h-[400px]">
                    {currentDeck.cards.length > 0 ? (
                      <div className="space-y-2">
                        {currentDeck.cards.map((card) => (
                          <div
                            key={card.reference}
                            className="flex items-center p-2 border border-altered-blue/30 rounded-md bg-altered-dark/50 hover:bg-altered-blue/10 transition-colors"
                          >
                            <div className="h-12 w-12 mr-3 flex-shrink-0 overflow-hidden rounded border border-altered-blue/50">
                              <img
                                src={card.imagePath || "/placeholder.svg"}
                                alt={card.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="flex-grow min-w-0">
                              <p className="font-medium text-sm truncate text-altered-light">{card.name}</p>
                              <p className="text-xs text-altered-light/70 truncate">
                                {card.mainFaction} • {card.cardType}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-altered-cyan">{card.quantity}x</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeCardFromDeck(card.reference)}
                                className="h-6 w-6 rounded-full hover:bg-red-900/30 hover:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-altered-light/50">No cards added to the deck.</div>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="stats">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-6">
                      <div className="altered-card p-3">
                        <h3 className="font-medium mb-2 text-altered-cyan">Faction Distribution</h3>
                        <div className="space-y-2">
                          {Object.entries(deckStats.factions).map(([faction, count]) => (
                            <div key={faction} className="flex justify-between items-center">
                              <span className="text-sm text-altered-light">{faction}</span>
                              <div className="flex items-center">
                                <div className="w-32 bg-altered-darker rounded-full h-2 mr-2 overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-altered-blue to-altered-purple h-full rounded-full"
                                    style={{ width: `${(count / deckStats.total) * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-altered-light/70">{count} cards</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="altered-card p-3">
                        <h3 className="font-medium mb-2 text-altered-cyan">Type Distribution</h3>
                        <div className="space-y-2">
                          {Object.entries(deckStats.types).map(([type, count]) => (
                            <div key={type} className="flex justify-between items-center">
                              <span className="text-sm text-altered-light">{type}</span>
                              <div className="flex items-center">
                                <div className="w-32 bg-altered-darker rounded-full h-2 mr-2 overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-altered-cyan to-altered-green h-full rounded-full"
                                    style={{ width: `${(count / deckStats.total) * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-altered-light/70">{count} cards</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="altered-card p-3">
                        <h3 className="font-medium mb-2 text-altered-cyan">Rarity Distribution</h3>
                        <div className="space-y-2">
                          {Object.entries(deckStats.rarities).map(([rarity, count]) => (
                            <div key={rarity} className="flex justify-between items-center">
                              <span className="text-sm text-altered-light">{rarity}</span>
                              <div className="flex items-center">
                                <div className="w-32 bg-altered-darker rounded-full h-2 mr-2 overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-altered-purple to-altered-blue h-full rounded-full"
                                    style={{ width: `${(count / deckStats.total) * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-altered-light/70">{count} cards</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="text-center py-12 text-altered-light/50 border border-dashed border-altered-blue/30 rounded-lg">
              <PlusCircle className="h-12 w-12 mx-auto mb-4 text-altered-blue/50" />
              <p className="text-altered-light/70">No deck selected.</p>
              <p className="text-sm">Please create or select a deck.</p>
            </div>
          )}
        </div>
      </div>

      {selectedCard && (
        <CardDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          card={selectedCard}
          allCards={cards}
        />
      )}
    </div>
  )
}

