import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';


/**
 * Production-Ready Data Table for SOC Labs.
 * Features: Responsive, scalable, and styled for dense technical data.
 */
const DataTable = ({ columns, data, className = "" }) => {
    return (
        <div className={`overflow-x-auto hide-scrollbar ${className}`}>
            <table className="saas-table">
                <thead>
                    <tr>
                        {columns.map((col, i) => (
                            <th key={i} style={{ width: col.width }}>
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    <AnimatePresence initial={false}>
                        {data.map((row, rowIndex) => (
                            <motion.tr
                                key={row.id || rowIndex}
                                initial={{ opacity: 0, x: -4 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="group hover:bg-white/[0.02] cursor-default"
                            >
                                {columns.map((col, colIndex) => (
                                    <td key={colIndex}>
                                        {col.render ? col.render(row[col.key], row) : (
                                            <span className="truncate block">
                                                {row[col.key] || '-'}
                                            </span>
                                        )}
                                    </td>
                                ))}
                            </motion.tr>
                        ))}
                    </AnimatePresence>
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;
