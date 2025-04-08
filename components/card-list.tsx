"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CardDetailsModal } from "@/components/card-details-modal"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Search, FilterX } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import cards from "@/public/all_card_details.json"

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

export function CardList() {
  const [filteredCards, setFilteredCards] = useState<CardData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [faction, setFaction] = useState<string>("")
  const [rarity, setRarity] = useState<string>("")
  const [cardType, setCardType] = useState<string>("")
  const [cardSet, setCardSet] = useState<string>("")
  const [hideSpecialCards, setHideSpecialCards] = useState(true)

  // Unique values for filters
  const [factions, setFactions] = useState<string[]>([])
  const [rarities, setRarities] = useState<string[]>([])
  const [cardTypes, setCardTypes] = useState<string[]>([])
  const [cardSets, setCardSets] = useState<string[]>([])

  useEffect(() => {
    const fetchCards = async () => {
      try {
        setFilteredCards(cards)

        // Extract unique values for filters
        setFactions([...new Set(cards.map((card: CardData) => card.mainFaction))] as string[])
        setRarities([...new Set(cards.map((card: CardData) => card.rarity))] as string[])
        setCardTypes([...new Set(cards.map((card: CardData) => card.cardType))] as string[])
        setCardSets([...new Set(cards.map((card: CardData) => card.cardSet))] as string[])

        setLoading(false)
      } catch (error) {
        console.error("Error fetching cards:", error)
        setLoading(false)
      }
    }

    fetchCards()
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

    if (cardSet && cardSet !== "all") {
      result = result.filter((card) => card.cardSet === cardSet)
    }

    // Filter out special cards if the checkbox is checked
    if (hideSpecialCards) {
      result = result.filter((card) => {
        const type = card.cardType.toLowerCase()

        // Check if the card is a hero, token, mana, or foiler
        const isHero = type == "hero"
        const isToken = type == "token character"
        const isMana = type == "mana"
        const isFoiler = type == "foiler"

        return !(isHero || isToken || isMana || isFoiler)
      })
    }

    setFilteredCards(result)
  }, [cards, searchTerm, faction, rarity, cardType, cardSet, hideSpecialCards])

  const handleCardClick = (card: CardData) => {
    setSelectedCard(card)
    setIsModalOpen(true)
  }

  const resetFilters = () => {
    setSearchTerm("")
    setFaction("")
    setRarity("")
    setCardType("")
    setCardSet("")
    setHideSpecialCards(true)
  }

  // Add event listener to handle opening a card by reference
  useEffect(() => {
    const handleOpenCard = (event: CustomEvent<{ cardReference: string }>) => {
      const cardToOpen = cards.find((card) => card.reference === event.detail.cardReference)
      if (cardToOpen) {
        setSelectedCard(cardToOpen)
        setIsModalOpen(true)
      }
    }

    // Add event listener
    window.addEventListener("openCard", handleOpenCard as EventListener)

    // Clean up
    return () => {
      window.removeEventListener("openCard", handleOpenCard as EventListener)
    }
  }, [cards])

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
          <h2 className="text-xl font-bold altered-title">Search Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="search" className="text-altered-light mb-1.5 block">
              Search by name or effect
            </Label>
            <div className="relative">
              <Input
                id="search"
                placeholder="Enter card name or effect"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="altered-input pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-altered-light/50" />
            </div>
          </div>

          <div>
            <Label htmlFor="faction" className="text-altered-light mb-1.5 block">
              Faction
            </Label>
            <Select value={faction} onValueChange={setFaction}>
              <SelectTrigger className="altered-select">
                <SelectValue placeholder="All factions" />
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
            <Label htmlFor="rarity" className="text-altered-light mb-1.5 block">
              Rarity
            </Label>
            <Select value={rarity} onValueChange={setRarity}>
              <SelectTrigger className="altered-select">
                <SelectValue placeholder="All rarities" />
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
            <Label htmlFor="cardType" className="text-altered-light mb-1.5 block">
              Card Type
            </Label>
            <Select value={cardType} onValueChange={setCardType}>
              <SelectTrigger className="altered-select">
                <SelectValue placeholder="All types" />
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

          <div>
            <Label htmlFor="cardSet" className="text-altered-light mb-1.5 block">
              Set
            </Label>
            <Select value={cardSet} onValueChange={setCardSet}>
              <SelectTrigger className="altered-select">
                <SelectValue placeholder="All sets" />
              </SelectTrigger>
              <SelectContent className="bg-altered-dark border-altered-blue/50">
                <SelectItem value="all">All sets</SelectItem>
                {cardSets.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center col-span-1 md:col-span-2 mt-2">
            <div className="flex items-center space-x-2 p-2 border border-altered-blue/30 rounded-md bg-altered-dark/50">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="hideSpecialCards"
                  checked={hideSpecialCards}
                  onChange={(e) => setHideSpecialCards(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="h-5 w-5 rounded border border-altered-blue/50 bg-altered-darker peer-checked:bg-altered-cyan peer-checked:border-altered-cyan transition-colors"></div>
                <svg
                  className="absolute h-3 w-3 text-white left-1 top-1 opacity-0 peer-checked:opacity-100 transition-opacity"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <Label htmlFor="hideSpecialCards" className="text-altered-light cursor-pointer">
                Hide Special Cards (Heroes, Tokens, Manas, Foilers)
              </Label>
            </div>
          </div>

          <div className="flex items-end">
            <Button
              onClick={resetFilters}
              variant="outline"
              className="border-altered-blue/50 hover:bg-altered-blue/20 hover:text-altered-cyan"
            >
              <FilterX className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </div>

        <div className="text-sm text-altered-light/70">{filteredCards.length} cards found</div>
      </div>

      <div className="altered-card p-4">
        <div className="altered-header mb-4">
          <h2 className="text-xl font-bold altered-title">Results</h2>
        </div>

        {filteredCards.length > 0 ? (
          <div className="altered-grid">
            {filteredCards.map((card) => (
              <div
                key={card.reference}
                className="altered-card altered-glow cursor-pointer transition-all duration-300 hover:scale-105 hover:animate-pulse-border"
                onClick={() => handleCardClick(card)}
              >
                <div className="aspect-[2/3] relative overflow-hidden rounded-t-lg">
                  <img
                    src={card.imagePath || "/placeholder.svg"}
                    alt={card.name}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-altered-darker to-transparent h-12 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="p-2 bg-gradient-to-r from-altered-blue/30 to-altered-purple/30 rounded-b-lg">
                  <p className="text-xs font-medium truncate text-altered-light">{card.name}</p>
                  <p className="text-xs text-altered-light/70 truncate">{card.mainFaction}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-altered-light/50">No cards found with the selected filters.</div>
        )}
      </div>

      {selectedCard && (
        <CardDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          card={selectedCard}
          handleCardClick={handleCardClick}
          allCards={cards}
        />
      )}
    </div>
  )
}

