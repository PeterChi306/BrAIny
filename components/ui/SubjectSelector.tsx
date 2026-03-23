'use client'

import React, { useState, useMemo } from 'react'
import { ChevronDown, Search, BookOpen } from 'lucide-react'
import { Subject, SUBJECTS, getSubjectById, searchSubjects } from '@/lib/subjects'

interface SubjectSelectorProps {
  value: string
  onChange: (subjectId: string) => void
  placeholder?: string
  className?: string
}

export function SubjectSelector({ value, onChange, placeholder = "Select a subject", className = "" }: SubjectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const selectedSubject = useMemo(() => getSubjectById(value), [value])

  const filteredSubjects = useMemo(() => {
    if (searchQuery.trim() === '') {
      return SUBJECTS
    }
    return searchSubjects(searchQuery)
  }, [searchQuery])

  const groupedSubjects = useMemo(() => {
    const groups: Record<string, Subject[]> = {}
    filteredSubjects.forEach(subject => {
      if (!groups[subject.category]) {
        groups[subject.category] = []
      }
      groups[subject.category].push(subject)
    })
    return groups
  }, [filteredSubjects])

  const handleSelect = (subjectId: string) => {
    onChange(subjectId)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-3">
          {selectedSubject ? (
            <>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white">
                  {selectedSubject.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {selectedSubject.description}
                </div>
              </div>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 max-h-80 overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search subjects..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Subject List */}
            <div className="overflow-y-auto max-h-60">
              {Object.entries(groupedSubjects).map(([category, subjects]) => (
                <div key={category} className="mb-2">
                  {/* Category Header */}
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    {category}
                  </div>
                  
                  {/* Subjects in Category */}
                  {subjects.map((subject) => (
                    <button
                      key={subject.id}
                      type="button"
                      onClick={() => handleSelect(subject.id)}
                      className={`w-full px-3 py-3 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        value === subject.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500' : ''
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        value === subject.id 
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-500' 
                          : 'bg-gradient-to-br from-gray-400 to-gray-500'
                      }`}>
                        <BookOpen className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium ${
                          value === subject.id 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {subject.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {subject.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
              
              {filteredSubjects.length === 0 && (
                <div className="p-6 text-center">
                  <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No subjects found</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try a different search term</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
