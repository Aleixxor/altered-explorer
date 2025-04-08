"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Info, Zap, Copy } from "lucide-react"
import { CardFactions } from "@/lib/cardFactions.enum"
import { CardRarities } from "@/lib/cardRarities.enum"

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

interface CardDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  card: CardData
  allCards: CardData[]
  handleCardClick: (card: CardData) => void
}

export function CardDetailsModal({ isOpen, onClose, card, allCards, handleCardClick }: Readonly<CardDetailsModalProps>) {
  const [relatedCards, setRelatedCards] = useState<CardData[]>([])
  const [sameNameCards, setSameNameCards] = useState<CardData[]>([])
  const [isModalOpen, setIsModalOpen] = useState(isOpen)

  useEffect(() => {
    setIsModalOpen(isOpen)
  }, [isOpen])

  useEffect(() => {
    if (card) {
      // Find cards with the same name
      const findSameNameCards = () => {
        return allCards.filter((c) => c.name === card.name && c.reference !== card.reference)
      }

      // Find cards that interact well with the selected card
      const findInteractingCards = () => {
        // Don't include the card itself or cards with the same name
        const otherCards = allCards.filter(
          (c) => c.reference !== card.reference && c.name !== card.name && (card.mainFaction == CardFactions.Neutral || c.mainFaction === card.mainFaction), // Only cards from the same faction
        )

        const interactingCards: CardData[] = []

        // 1. Cards that explicitly mention this card's name in their effects
        const nameMatches = otherCards.filter(
          (c) =>
            (c.mainEffect?.toLowerCase().includes(card.name?.toLowerCase())) ||
            (c.echoEffect?.toLowerCase().includes(card.name?.toLowerCase())),
        )
        interactingCards.push(...nameMatches)

        // 2. Cards that share specific keywords or mechanics from the effect text
        const cardKeywords = extractKeywords(card.mainEffect || "").concat(extractKeywords(card.echoEffect || ""))

        if (cardKeywords.length > 0) {
          const keywordMatches = otherCards.filter((c) => {
            const otherKeywords = extractKeywords(c.mainEffect || "").concat(extractKeywords(c.echoEffect || ""))

            // Check for keyword overlap
            return cardKeywords.some((keyword) => otherKeywords.includes(keyword) && !interactingCards.includes(c))
          })

          interactingCards.push(...keywordMatches)
        }

        // 3. Cards with matching subtypes that often work well together
        if (card.cardSubTypes) {
          const subtypeMatches = otherCards.filter(
            (c) =>
              c.cardSubTypes &&
              c.cardSubTypes.split(", ").some((subType) => card.cardSubTypes.includes(subType)) &&
              !interactingCards.includes(c),
          )
          interactingCards.push(...subtypeMatches)
        }

        // 4. Cards with complementary power types
        if (card.oceanPower && Number.parseInt(card.oceanPower) > 0) {
          const oceanCards = otherCards.filter(
            (c) => c.oceanPower && Number.parseInt(c.oceanPower) > 0 && !interactingCards.includes(c),
          )
          interactingCards.push(...oceanCards)
        }

        if (card.forestPower && Number.parseInt(card.forestPower) > 0) {
          const forestCards = otherCards.filter(
            (c) => c.forestPower && Number.parseInt(c.forestPower) > 0 && !interactingCards.includes(c),
          )
          interactingCards.push(...forestCards)
        }

        if (card.mountainPower && Number.parseInt(card.mountainPower) > 0) {
          const mountainCards = otherCards.filter(
            (c) => c.mountainPower && Number.parseInt(c.mountainPower) > 0 && !interactingCards.includes(c),
          )
          interactingCards.push(...mountainCards)
        }

        // Remove duplicates and limit to a reasonable number
        return Array.from(new Set(interactingCards)).slice(0, 12)
      }

      setSameNameCards(findSameNameCards())
      setRelatedCards(findInteractingCards())
    }
  }, [card, allCards])

  // Helper function to extract meaningful keywords from card effects
  const extractKeywords = (text: string): string[] => {
    if (!text) return []

    // List of common keywords and mechanics in card games
    const potentialKeywords = [
      "draw",
      "discard",
      "destroy",
      "sacrifice",
      "summon",
      "equip",
      "heal",
      "damage",
      "power",
      "energy",
      "mana",
      "attack",
      "defend",
      "protect",
      "immune",
      "resistant",
      "echo",
      "recall",
      "search",
      "find",
      "ocean",
      "forest",
      "mountain",
      "ritual",
      "magic",
      "spell",
      "transform",
      "convert",
      "reduce",
      "increase",
      "double",
      "create",
      "token",
    ]

    // Extract words that match our potential keywords
    const words = text.toLowerCase().match(/\b(\w+)\b/g) || []
    return words.filter(
      (word) => potentialKeywords.includes(word) || word.length > 7, // Longer words are likely meaningful game terms
    )
  }

  if (!card) return null

  const selectCard = (selectedCard: CardData) => {
    setIsModalOpen(false)
    // Delay the opening of the modal to allow for the closing animation
    setTimeout(() => {
      handleCardClick(selectedCard)
      setIsModalOpen(true)
    }, 300)
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-altered-dark border border-altered-blue/50">
        <DialogHeader className="altered-header">
          <DialogTitle className="altered-title text-xl">{card.name}</DialogTitle>
          <DialogDescription className="text-altered-light/70">
            {card.mainFaction} • {card.rarity} • {card.cardType} {card.cardSubTypes ? `• ${card.cardSubTypes}` : ""}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="grid w-full grid-cols-3 bg-altered-darker border border-altered-blue/30 rounded-lg">
            <TabsTrigger value="details" className="altered-tab flex items-center">
              <Info className="mr-2 h-4 w-4" />
              Card Details
            </TabsTrigger>
            <TabsTrigger value="related" className="altered-tab flex items-center">
              <Zap className="mr-2 h-4 w-4" />
              Synergy Cards ({relatedCards.length})
            </TabsTrigger>
            <TabsTrigger value="versions" className="altered-tab flex items-center">
              <Copy className="mr-2 h-4 w-4" />
              Versions ({sameNameCards.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="altered-card p-1 overflow-hidden">
                <img src={card.imagePath || "/placeholder.svg"} alt={card.name} className="w-full rounded-lg" />
              </div>

              <div className="space-y-4">
                <div className="altered-card p-3">
                  <h3 className="text-sm font-medium text-altered-cyan mb-2">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <h4 className="text-xs font-medium text-altered-light/70">Faction</h4>
                      <p className="text-sm text-altered-light">{card.mainFaction}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-altered-light/70">Rarity</h4>
                      <p className="text-sm text-altered-light">{card.rarity}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-altered-light/70">Type</h4>
                      <p className="text-sm text-altered-light">{card.cardType}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-altered-light/70">Subtypes</h4>
                      <p className="text-sm text-altered-light">{card.cardSubTypes || "None"}</p>
                    </div>
                  </div>
                </div>

                {(card.mainCost || card.recallCost) ? (
                  <div className="altered-card p-3">
                    <h3 className="text-sm font-medium text-altered-cyan mb-2">Costs</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <h4 className="text-xs font-medium text-altered-light/70">Main Cost</h4>
                        <p className="text-sm text-altered-light">{card.mainCost}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-altered-light/70">Recall Cost</h4>
                        <p className="text-sm text-altered-light">{card.recallCost}</p>
                      </div>
                    </div>
                  </div>
                ) : <></>}

                {(card.oceanPower || card.forestPower || card.mountainPower) ? (
                  <div className="altered-card p-3">
                    <h3 className="text-sm font-medium text-altered-cyan mb-2">Power</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <h4 className="text-xs font-medium text-altered-light/70">Ocean</h4>
                        <p className="text-sm text-altered-light">{card.oceanPower || "0"}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-altered-light/70">Forest</h4>
                        <p className="text-sm text-altered-light">{card.forestPower || "0"}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-altered-light/70">Mountain</h4>
                        <p className="text-sm text-altered-light">{card.mountainPower || "0"}</p>
                      </div>
                    </div>
                  </div>
                ) : <></>}

                {(card.mainEffect || card.echoEffect) ? (
                  <div className="altered-card p-3">
                    <h3 className="text-sm font-medium text-altered-cyan mb-2">Effects</h3>
                    {card.mainEffect && (
                      <div className="mb-2">
                        <h4 className="text-xs font-medium text-altered-light/70">Main Effect</h4>
                        <p className="text-sm text-altered-light">{card.mainEffect}</p>
                      </div>
                    )}

                    {card.echoEffect && (
                      <div>
                        <h4 className="text-xs font-medium text-altered-light/70">Echo Effect</h4>
                        <p className="text-sm text-altered-light">{card.echoEffect}</p>
                      </div>
                    )}
                  </div>
                ) : <></>}

                <div className="altered-card p-3">
                  <h3 className="text-sm font-medium text-altered-cyan mb-2">Collection</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <h4 className="text-xs font-medium text-altered-light/70">Set</h4>
                      <p className="text-sm text-altered-light">{card.cardSet}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-altered-light/70">Reference</h4>
                      <p className="text-sm text-altered-light">{card.reference}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="related">
            {relatedCards.length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm text-altered-light/70 mb-2">
                  These cards from the <span className="text-altered-cyan">{card.mainFaction}</span> faction have good
                  synergy with <span className="text-altered-cyan">{card.name}</span>:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {relatedCards.map((relatedCard) => (
                    <div
                      key={relatedCard.reference}
                      className={`altered-card altered-glow cursor-pointer transition-all duration-300 hover:scale-105 
                          ${relatedCard.rarity == CardRarities.Rare ? "shadow-lg shadow-altered-cyan/50" : ""}`}
                      onClick={() => selectCard(relatedCard)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          selectCard(relatedCard);
                        }
                      }}
                    >
                      <div className="aspect-[2/3] relative overflow-hidden rounded-t-lg">
                        <img
                          src={relatedCard.imagePath || "/placeholder.svg"}
                          alt={relatedCard.name}
                          className="object-cover w-full h-full"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-altered-darker/80 to-transparent opacity-0 hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-2">
                            <p className="text-xs text-altered-light/90 line-clamp-3">{relatedCard.mainEffect}</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-2 bg-gradient-to-r from-altered-blue/30 to-altered-purple/30 rounded-b-lg">
                        <p className="text-xs font-medium truncate text-altered-light">{relatedCard.name}</p>
                        <p className="text-xs text-altered-light/70 truncate">
                          {relatedCard.mainFaction} • {relatedCard.cardType}
                        </p>
                        {relatedCard.cardSubTypes && (
                          <p className="text-[10px] text-altered-light/50 truncate">{relatedCard.cardSubTypes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-altered-light/50">
                No synergy cards found in the {card.mainFaction} faction.
              </div>
            )}
          </TabsContent>

          <TabsContent value="versions">
            {sameNameCards.length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm text-altered-light/70 mb-2">
                  Other versions of <span className="text-altered-cyan">{card.name}</span> from different sets:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {sameNameCards.map((versionCard) => (
                    <div
                      key={versionCard.reference}
                      className={`altered-card altered-glow cursor-pointer transition-all duration-300 hover:scale-105 
                          ${versionCard.rarity == CardRarities.Rare ? "shadow-lg shadow-altered-cyan/50" : ""}`}
                      onClick={() => selectCard(versionCard)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          selectCard(versionCard);
                        }
                      }}
                    >
                      <div className="aspect-[2/3] relative overflow-hidden rounded-t-lg">
                        <img
                          src={versionCard.imagePath || "/placeholder.svg"}
                          alt={versionCard.name}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="p-2 bg-gradient-to-r from-altered-blue/30 to-altered-purple/30 rounded-b-lg">
                        <p className="text-xs font-medium truncate text-altered-light">{versionCard.name}</p>
                        <p className="text-xs text-altered-light/70 truncate">{versionCard.cardSet}</p>
                        <p className="text-[10px] text-altered-light/50 truncate">{versionCard.rarity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-altered-light/50">No other versions of this card found.</div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

