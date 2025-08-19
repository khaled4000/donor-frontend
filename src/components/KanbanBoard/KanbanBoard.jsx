// import React, { useState, useRef, useEffect } from 'react';
// import './KanbanBoard.css';

// const KanbanBoard = ({ 
//   data, 
//   onCaseMove, 
//   onCaseSelect, 
//   className = '',
//   enableVirtualScrolling = false,
//   maxVisibleCases = 50
// }) => {
//   const [draggedCase, setDraggedCase] = useState(null);
//   const [dragOverColumn, setDragOverColumn] = useState(null);
//   const [dragPreview, setDragPreview] = useState(null);
//   const [visibleCases, setVisibleCases] = useState({});
//   const dragPreviewRef = useRef(null);

//   const columns = [
//     { id: 'submitted', title: 'Submitted', icon: '📋', color: '#fbbf24' },
//     { id: 'under_review', title: 'Under Review', icon: '🔍', color: '#3b82f6' },
//     { id: 'approved', title: 'Approved', icon: '✅', color: '#10b981' }
//   ];

//   useEffect(() => {
//     if (enableVirtualScrolling) {
//       const newVisibleCases = {};
//       columns.forEach(column => {
//         const columnCases = data[column.id] || [];
//         newVisibleCases[column.id] = columnCases.slice(0, maxVisibleCases);
//       });
//       setVisibleCases(newVisibleCases);
//     }
//   }, [data, enableVirtualScrolling, maxVisibleCases]);

//   const handleDragStart = (e, caseItem, columnId) => {
//     setDraggedCase({ ...caseItem, sourceColumn: columnId });
//     e.dataTransfer.effectAllowed = 'move';
    
//     // Create custom drag preview
//     if (dragPreviewRef.current) {
//       e.dataTransfer.setDragImage(dragPreviewRef.current, 0, 0);
//     }
//   };

//   const handleDragOver = (e, columnId) => {
//     e.preventDefault();
//     e.dataTransfer.dropEffect = 'move';
//     setDragOverColumn(columnId);
//   };

//   const handleDragLeave = () => {
//     setDragOverColumn(null);
//   };

//   const handleDrop = (e, targetColumnId) => {
//     e.preventDefault();
    
//     if (draggedCase && draggedCase.sourceColumn !== targetColumnId) {
//       onCaseMove(draggedCase.id, draggedCase.sourceColumn, targetColumnId);
//     }
    
//     setDraggedCase(null);
//     setDragOverColumn(null);
//   };

//   const handleCaseClick = (caseItem) => {
//     if (onCaseSelect) {
//       onCaseSelect(caseItem);
//     }
//   };

//   const getCasesForColumn = (columnId) => {
//     if (enableVirtualScrolling) {
//       return visibleCases[columnId] || [];
//     }
//     return data[columnId] || [];
//   };

//   const renderCaseCard = (caseItem, columnId) => {
//     const isDragging = draggedCase?.id === caseItem.id;
    
//     return (
//       <div
//         key={caseItem.id}
//         className={`kanban-card ${isDragging ? 'dragging' : ''}`}
//         draggable
//         onDragStart={(e) => handleDragStart(e, caseItem, columnId)}
//         onClick={() => handleCaseClick(caseItem)}
//         style={{ cursor: 'grab' }}
//       >
//         <div className="card-header">
//           <h4>{caseItem.caseId || caseItem.id}</h4>
//           <span className={`status-badge ${caseItem.status}`}>
//             {caseItem.status}
//           </span>
//         </div>
        
//         <div className="card-content">
//           <h5>{caseItem.familyName || caseItem.family?.familyName}</h5>
//           <p>
//             <i className="fas fa-map-marker-alt"></i>
//             {caseItem.village || caseItem.family?.village}
//           </p>
//           <p>
//             <i className="fas fa-users"></i>
//             {caseItem.numberOfMembers || caseItem.family?.numberOfMembers} members
//           </p>
//           {caseItem.formCompletion !== undefined && (
//             <div className="progress-bar">
//               <div 
//                 className="progress-fill" 
//                 style={{ width: `${caseItem.formCompletion}%` }}
//               ></div>
//             </div>
//           )}
//         </div>
        
//         <div className="card-footer">
//           <small>
//             {caseItem.submittedAt ? 
//               new Date(caseItem.submittedAt).toLocaleDateString() :
//               new Date(caseItem.createdAt).toLocaleDateString()
//             }
//           </small>
//         </div>
//       </div>
//     );
//   };

//   const renderEmptyColumn = (column) => (
//     <div className="empty-column">
//       <i className="fas fa-inbox"></i>
//       <p>No cases in {column.title}</p>
//     </div>
//   );

//   return (
//     <div className={`kanban-container ${className}`}>
//       {/* Drag Preview Element */}
//       <div ref={dragPreviewRef} className="drag-preview" style={{ display: 'none' }}>
//         <div className="preview-card">
//           <h4>Case Preview</h4>
//           <p>Drag to move</p>
//           <small>Drop to change status</small>
//         </div>
//       </div>

//       {columns.map(column => {
//         const columnCases = getCasesForColumn(column.id);
//         const isDragOver = dragOverColumn === column.id;
        
//         return (
//           <div
//             key={column.id}
//             className={`kanban-column ${isDragOver ? 'drag-over' : ''}`}
//             onDragOver={(e) => handleDragOver(e, column.id)}
//             onDragLeave={handleDragLeave}
//             onDrop={(e) => handleDrop(e, column.id)}
//           >
//             <div className="column-header">
//               <div>
//                 <h3>{column.title}</h3>
//                 <span className="column-icon">{column.icon}</span>
//               </div>
//               <span className="case-count">{columnCases.length}</span>
//             </div>
            
//             <div className="column-content">
//               {columnCases.length > 0 ? (
//                 columnCases.map(caseItem => renderCaseCard(caseItem, column.id))
//               ) : (
//                 renderEmptyColumn(column)
//               )}
              
//               {enableVirtualScrolling && (data[column.id]?.length || 0) > maxVisibleCases && (
//                 <div className="virtual-scroll-indicator">
//                   <p>Scroll to see more cases...</p>
//                 </div>
//               )}
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// };

// export default KanbanBoard;
import React, { useState, useRef, useEffect } from 'react';
import './KanbanBoard.css';

const KanbanBoard = ({ 
  data, 
  onCaseMove, 
  onCaseSelect, 
  className = '',
  enableVirtualScrolling = false,
  maxVisibleCases = 50
}) => {
  const [draggedCase, setDraggedCase] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [dragPreview, setDragPreview] = useState(null);
  const [visibleCases, setVisibleCases] = useState({});
  const dragPreviewRef = useRef(null);

  const columns = [
    { id: 'submitted', title: 'Submitted', icon: '📋', color: '#fbbf24' },
    { id: 'under_review', title: 'Under Review', icon: '🔍', color: '#3b82f6' },
    { id: 'approved', title: 'Approved', icon: '✅', color: '#10b981' }
  ];

  useEffect(() => {
    if (enableVirtualScrolling) {
      const newVisibleCases = {};
      columns.forEach(column => {
        const columnCases = data[column.id] || [];
        newVisibleCases[column.id] = columnCases.slice(0, maxVisibleCases);
      });
      setVisibleCases(newVisibleCases);
    }
  }, [data, enableVirtualScrolling, maxVisibleCases]);

  const handleDragStart = (e, caseItem, columnId) => {
    setDraggedCase({ ...caseItem, sourceColumn: columnId });
    e.dataTransfer.effectAllowed = 'move';
    
    // Create custom drag preview
    if (dragPreviewRef.current) {
      e.dataTransfer.setDragImage(dragPreviewRef.current, 0, 0);
    }
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e, targetColumnId) => {
    e.preventDefault();
    
    if (draggedCase && draggedCase.sourceColumn !== targetColumnId) {
      onCaseMove(draggedCase.id, draggedCase.sourceColumn, targetColumnId);
    }
    
    setDraggedCase(null);
    setDragOverColumn(null);
  };

  const handleCaseClick = (caseItem) => {
    if (onCaseSelect) {
      onCaseSelect(caseItem);
    }
  };

  const getCasesForColumn = (columnId) => {
    if (enableVirtualScrolling) {
      return visibleCases[columnId] || [];
    }
    return data[columnId] || [];
  };

  const renderCaseCard = (caseItem, columnId) => {
    const isDragging = draggedCase?.id === caseItem.id;
    
    return (
      <div
        key={caseItem.id}
        className={`kanban-card ${isDragging ? 'dragging' : ''}`}
        draggable
        onDragStart={(e) => handleDragStart(e, caseItem, columnId)}
        onClick={() => handleCaseClick(caseItem)}
        style={{ cursor: 'grab' }}
      >
        <div className="card-header">
          <h4>{caseItem.caseId || caseItem.id}</h4>
          <span className={`status-badge ${caseItem.status}`}>
            {caseItem.status}
          </span>
        </div>
        
        <div className="card-content">
          <h5>{caseItem.familyName || caseItem.family?.familyName}</h5>
          <p>
            <i className="fas fa-map-marker-alt"></i>
            {caseItem.village || caseItem.family?.village}
          </p>
          <p>
            <i className="fas fa-users"></i>
            {caseItem.numberOfMembers || caseItem.family?.numberOfMembers} members
          </p>
          {caseItem.formCompletion !== undefined && (
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${caseItem.formCompletion}%` }}
              ></div>
            </div>
          )}
        </div>
        
        <div className="card-footer">
          <small>
            {caseItem.submittedAt ? 
              new Date(caseItem.submittedAt).toLocaleDateString() :
              new Date(caseItem.createdAt).toLocaleDateString()
            }
          </small>
        </div>
      </div>
    );
  };

  const renderEmptyColumn = (column) => (
    <div className="empty-column">
      <i className="fas fa-inbox"></i>
      <p>No cases in {column.title}</p>
    </div>
  );

  return (
    <div className={`kanban-container ${className}`}>
      {/* Drag Preview Element */}
      <div ref={dragPreviewRef} className="drag-preview" style={{ display: 'none' }}>
        <div className="preview-card">
          <h4>Case Preview</h4>
          <p>Drag to move</p>
          <small>Drop to change status</small>
        </div>
      </div>

      {columns.map(column => {
        const columnCases = getCasesForColumn(column.id);
        const isDragOver = dragOverColumn === column.id;
        
        return (
          <div
            key={column.id}
            className={`kanban-column ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="column-header">
              <div>
                <h3>{column.title}</h3>
                <span className="column-icon">{column.icon}</span>
              </div>
              <span className="case-count">{columnCases.length}</span>
            </div>
            
            <div className="column-content">
              {columnCases.length > 0 ? (
                columnCases.map(caseItem => renderCaseCard(caseItem, column.id))
              ) : (
                renderEmptyColumn(column)
              )}
              
              {enableVirtualScrolling && (data[column.id]?.length || 0) > maxVisibleCases && (
                <div className="virtual-scroll-indicator">
                  <p>Scroll to see more cases...</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
