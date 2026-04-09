import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanstackDevtools } from '@tanstack/react-devtools'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import StoreDevtools from '../lib/demo-store-devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

import { Toaster } from 'react-hot-toast'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Fuse - Hub of fun activities',
      },
      {
        name: 'description',
        content: 'A room based app to do fun activities with your friends',
      },
      // Open Graph
      { property: 'og:title', content: 'Fuse - Hub of fun activities' },
      { property: 'og:description', content: 'A room based app to do fun activities with your friends' },
      { property: 'og:image', content: '/og-image.png' },
      { property: 'og:type', content: 'article' },
      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Fuse - Hub of fun activities' },
      { name: 'twitter:description', content: 'A room based app to do fun activities with your friends' },
      { name: 'twitter:image', content: '/og-image.png' },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: 'Fuse - Hub of fun activities',
          description: 'A room based app to do fun activities with your friends',
          image: '/og-image.png',
          author: {
            '@type': 'Person',
            name: 'Fuse Team',
          },
          datePublished: '2026-03-31',
        }),
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </head>
      <body>
        {children}
        <TanstackDevtools
          config={{
            position: 'bottom-left',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
            StoreDevtools,
          ]}
        />
        <Toaster />
        <Scripts />
      </body>
    </html>
  )
}
