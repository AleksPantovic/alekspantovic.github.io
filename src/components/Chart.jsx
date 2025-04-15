import React, { useState } from 'react'

const Chart = () => {
    const [searchTerm, setSearchTerm] = useState('');
    
  // Sample organization data
  const orgData = {
    id: 1,
    name: "Niko Rehmann",
    title: "CEO / Founder",
    department: "Management",
    image: "/api/placeholder/40/40",
    children: [
      {
        id: 2,
        name: "Günter Steffensen",
        title: "COO / Partner",
        department: "Management",
        image: "/api/placeholder/40/40",
      },
      {
        id: 3,
        name: "Thomas Biller",
        title: "Project Development",
        department: "Product Development",
        image: "/api/placeholder/40/40",
        children: [
          {
            id: 11,
            name: "Daniel Wolf",
            title: "Digital Business Consultant",
            department: "Product Development",
            image: "/api/placeholder/40/40",
          },
          {
            id: 12,
            name: "Frida Rodriguez",
            title: "Project Manager",
            department: "Product Development",
            image: "/api/placeholder/40/40",
          }
        ]
      },
      {
        id: 4,
        name: "Carmen Bonilla",
        title: "Frontend Development Team Lead",
        department: "Frontend",
        image: "/api/placeholder/40/40",
        children: [
          {
            id: 13,
            name: "Matthias Weikuk",
            title: "Frontend Developer",
            department: "Frontend",
            image: "/api/placeholder/40/40",
          },
          {
            id: 14,
            name: "Ayushri Zizhen",
            title: "Frontend Developer",
            department: "Frontend",
            image: "/api/placeholder/40/40",
          }
        ]
      }
    ]
  };

  // Render a single node in the org chart
  const renderNode = (node) => {
    return (
      <div key={node.id} className="flex flex-col items-center">
        <div className="border rounded-md p-3 w-48 flex flex-col items-center bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <img src={node.image} className="rounded-full" alt={node.name} />
            <div className="text-sm">
              <div className="font-semibold">{node.name}</div>
              <div className="text-gray-600 text-xs">{node.title}</div>
            </div>
          </div>
          <div className="text-xs text-gray-500">{node.department}</div>
          <div className="border-t w-full my-2" />
        </div>
        
        {node.children && node.children.length > 0 && (
          <>
            <div className="h-6 border-l" />
            <div className="relative">
              <div className="absolute h-6 border-l left-1/2 -translate-x-px top-0" />
              <div className="flex gap-6 pt-6">
                {node.children.map(child => (
                  <div key={child.id} className="relative">
                    <div className="absolute h-6 border-t top-0 left-1/2 -translate-y-6 w-1/2" style={{ right: child === node.children[0] ? 'auto' : 0 }} />
                    {renderNode(child)}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            className="border rounded-md py-2 px-3 pl-10 w-full max-w-md"
            placeholder="Suche nach Name oder Jobtitel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg 
            className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
          {searchTerm && (
            <button 
              className="absolute right-3 top-2.5 text-gray-400"
              onClick={() => setSearchTerm('')}
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="flex justify-center overflow-auto">
        {renderNode(orgData)}
      </div>
      
      <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-white p-2 rounded-md shadow-md">
        <button className="p-2 border rounded">−</button>
        <span>33%</span>
        <button className="p-2 border rounded">+</button>
      </div>
    </div>
  );
}

export default Chart
