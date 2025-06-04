# Hand Tracking Data Visualization

An interactive web application that uses hand tracking to manipulate and join database tables through natural gestures. Built with React, TypeScript, MediaPipe, and Supabase.

## 🎥 Watch How It Was Built

[![Hand Tracking Demo](https://img.youtube.com/vi/TLKxx_-fdio/maxresdefault.jpg)](https://youtu.be/TLKxx_-fdio)

**[▶️ Watch the full build process on YouTube](https://youtu.be/TLKxx_-fdio)** - See how this project was created from scratch!

## 🎯 Features

- **Real-time Hand Tracking**: Uses MediaPipe to detect and track hand movements via webcam
- **Gesture-based Interface**: Drag and drop database tables using hand gestures
- **Dynamic Data Visualization**: Join tables and visualize relationships with interactive charts
- **Multiple Camera Support**: Select from available cameras on your device
- **Supabase Integration**: Connect to your Supabase database and explore table relationships

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Supabase account and project
- A webcam for hand tracking

### Installation

1. Clone the repository:

```bash
git clone https://github.com/dshukertjr/iron-man-table.git
cd iron-man-table
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:

```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## 🎮 How to Use

1. **Camera Selection**: When you first open the app, select your preferred camera from the available options.

2. **Hand Gestures**:

   - **Pinch to Grab**: Bring your thumb and index finger together to grab a table
   - **Drag**: Move your pinched hand to drag tables around the screen
   - **Release**: Separate your fingers to drop the table

3. **Joining Tables**:

   - Drag one table close to another to see available join options
   - The system will automatically detect foreign key relationships
   - Release the table when you see the join indicator

4. **Data Visualization**:
   - Once tables are joined, a chart will appear showing the relationship
   - The visualization adapts based on the data types and relationships

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Hand Tracking**: MediaPipe Hands
- **Database**: Supabase
- **State Management**: React Hooks

## 📁 Project Structure

```
src/
├── components/         # React components
│   ├── HandTracking.tsx    # Main hand tracking component
│   ├── CameraSelector.tsx  # Camera selection UI
│   └── TableList.tsx       # Database table list
├── hooks/             # Custom React hooks
│   └── useSupabaseTables.ts # Supabase table fetching
├── lib/               # Third-party configurations
│   └── supabase.ts    # Supabase client setup
├── App.tsx            # Main application component
└── main.tsx          # Application entry point
```

## 🙏 Acknowledgments

- [MediaPipe](https://mediapipe.dev/) for the amazing hand tracking technology
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
