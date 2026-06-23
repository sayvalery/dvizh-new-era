import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import {
  lexicalEditor,
  FixedToolbarFeature,
  HeadingFeature,
  LinkFeature,
  StrikethroughFeature,
} from '@payloadcms/richtext-lexical'
import { seoPlugin } from '@payloadcms/plugin-seo'
import type { GenerateTitle, GenerateDescription, GenerateImage, GenerateURL } from '@payloadcms/plugin-seo/types'
import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

// Контент
import { BlogPosts } from './collections/BlogPosts'
import { Categories } from './collections/Categories'
import { Tags } from './collections/Tags'
import { Persons } from './collections/Persons'
import { Companies } from './collections/Companies'
import { Videos } from './collections/Videos'
import { Research } from './collections/Research'
import { Cases } from './collections/Cases'
import { Glossaries } from './collections/Glossaries'
import { Events } from './collections/Events'
import { Media } from './collections/Media'
// Система
import { Users } from './collections/Users'
import { FormSubmissions } from './collections/FormSubmissions'
// Интеграции (Тип B — скрипты страниц)
import { PageScripts } from './collections/PageScripts'
// Интеграции / мониторинг (глобалы)
import { IntegrationsConfig } from './globals/IntegrationsConfig'
import { BotConfig } from './globals/BotConfig'
import { MonitorStatus } from './globals/MonitorStatus'
// Navigation and Footer globals removed — hardcoded in frontend for stability
// import { Navigation } from './globals/Navigation'
// import { Footer } from './globals/Footer'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.SERVER_URL || 'http://localhost:3002',
  admin: {
    user: 'users',
    meta: {
      titleSuffix: '— Dvizh CMS',
    },
    components: {
      graphics: {
        Icon: '/src/graphics/Icon',
      },
      afterNavLinks: ['/src/components/DeployButton', '/src/components/StatusLink'],
      views: {
        status: {
          Component: '/src/components/StatusView',
          path: '/status',
        },
      },
    },
    livePreview: {
      url: ({ data, collectionConfig }) => {
        const base = process.env.WEB_URL || 'http://localhost:4321'
        const slug = collectionConfig?.slug
        if (slug === 'blog-posts') return `${base}/blog/${data?.slug}`
        if (slug === 'persons') return `${base}/person/${data?.slug}`
        if (slug === 'companies') return `${base}/companies/${data?.slug}`
        if (slug === 'glossaries') return `${base}/slovar-developera/${data?.slug}`
        return `${base}/${data?.slug}`
      },
      collections: ['blog-posts', 'persons', 'companies', 'glossaries'],
    },
  },
  collections: [
    // Контент
    BlogPosts,
    Categories,
    Tags,
    Persons,
    Companies,
    Videos,
    Research,
    Cases,
    Glossaries,
    Events,
    Media,
    // Система
    Users,
    FormSubmissions,
    // Интеграции (Тип B)
    PageScripts,
  ],
  globals: [
    IntegrationsConfig,
    BotConfig,
    MonitorStatus,
  ],
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      // Сохраняем все дефолтные фичи Payload (paragraph, bold, italic, lists, blockquote, inline toolbar и т.д.)
      // Дефолтные HeadingFeature/LinkFeature/StrikethroughFeature будут переопределены ниже.
      ...defaultFeatures.filter(
        (f) => !['heading', 'link', 'strikethrough'].includes(f.key),
      ),
      // 1. Постоянная панель сверху с дропдауном Paragraph / H1-H6 — позволяет переключать
      //    блок без пересоздания.
      FixedToolbarFeature(),
      // Ограничиваем выбор размеров заголовков для маркетологов (H1 на странице должен быть один).
      HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
      // 3. Зачёркнутый текст (кнопка в тулбаре + горячая клавиша Cmd/Ctrl+Shift+S).
      StrikethroughFeature(),
      // 2. Ссылки с галочками "Открывать в новой вкладке" (newTab — дефолт) и "rel=nofollow".
      LinkFeature({
        fields: ({ defaultFields }) => [
          ...defaultFields,
          {
            name: 'nofollow',
            type: 'checkbox',
            label: 'rel="nofollow"',
            admin: {
              description: 'Не передавать ссылочный вес (для рекламы и внешних ненадёжных доменов).',
            },
          },
        ],
      }),
    ],
  }),
  secret: process.env.PAYLOAD_SECRET || 'dev-secret-change-in-production',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || 'postgresql://dvizh:dvizh@localhost:5432/dvizh',
    },
    push: true,
  }),
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore — sharp types incompatible with Payload's SharpDependency, works at runtime
  sharp,
  cors: [
    process.env.WEB_URL || 'http://localhost:4321',
    'https://dvizh.cc',
    'https://www.dvizh.cc',
  ],
  plugins: [
    seoPlugin({
      collections: ['blog-posts'],
      uploadsCollection: 'media',
      tabbedUI: false,
      generateTitle: (({ doc }) => (doc?.title as string) ?? '') satisfies GenerateTitle,
      generateDescription: (({ doc }) => (doc?.excerpt as string) ?? '') satisfies GenerateDescription,
      generateImage: (({ doc }) => doc?.cover) satisfies GenerateImage,
      generateURL: (({ doc }) =>
        `${process.env.WEB_URL || 'https://dvizh.io'}/blog/${(doc?.slug as string) ?? ''}`) satisfies GenerateURL,
    }),
  ],
})
