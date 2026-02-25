import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Tags } from './collections/Tags'
import { Companies } from './collections/Companies'
import { Persons } from './collections/Persons'
import { BlogPosts } from './collections/BlogPosts'
import { Videos } from './collections/Videos'
import { Research } from './collections/Research'
import { Cases } from './collections/Cases'
import { Glossaries } from './collections/Glossaries'
import { Events } from './collections/Events'
import { FormSubmissions } from './collections/FormSubmissions'
import { Navigation } from './globals/Navigation'
import { Footer } from './globals/Footer'

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
    },
  },
  collections: [
    Users,
    Media,
    Categories,
    Tags,
    Companies,
    Persons,
    BlogPosts,
    Videos,
    Research,
    Cases,
    Glossaries,
    Events,
    FormSubmissions,
  ],
  globals: [
    Navigation,
    Footer,
  ],
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET || 'dev-secret-change-in-production',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || 'postgresql://dvizh:dvizh@localhost:5432/dvizh',
    },
  }),
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore — sharp types incompatible with Payload's SharpDependency, works at runtime
  sharp,
  cors: [
    process.env.WEB_URL || 'http://localhost:4321',
  ],
})
