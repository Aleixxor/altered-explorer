"use client"

import { CardList } from "@/components/card-list"

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto py-6">
        <header className="flex flex-col items-center justify-center mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-altered-blue/20 to-altered-purple/20 blur-xl rounded-full"></div>
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 altered-title relative">
            Altered TCG Explorer
          </h1>
          <p className="text-altered-light/70 text-center max-w-2xl relative">
            Explore the Altered TCG universe, search for cards, and discover powerful synergies.
          </p>
        </header>

        <CardList />
      </div>

      <footer className="mt-12 py-6 border-t border-altered-blue/30 bg-altered-darker">
        <div className="container mx-auto text-center">
          <p className="text-altered-light/50 text-sm">
            Altered TCG Explorer - Unofficial - Created by <a href="https://www.linkedin.com/in/alex-louzada/" target="blank">Aleixxor</a> for fans of the game
          </p>
          <p className="text-altered-light/50 text-sm">
            <a href="https://www.altered.gg/" target="blank">
              All rights reserved to Altered and Equinox
            </a>
          </p>
        </div>
      </footer>
    </main>
  )
}

