import React, { useState } from 'react';
import { useActions, useUIState } from "ai/rsc";
import { AI } from "@/app/action";
import { useToast } from "@/components/ui/use-toast"
import { ToastAction } from '../ui/toast';
import { MemoizedReactMarkdown } from '../markdown';
import { UserMessage } from './message';

type Message = {
  id: number;
  display: React.ReactNode;
};

type QuizQuestionProps = {
  question: string;
  questionType: 'multiple-choice' | 'single-choice';
  possibleAnswers: string[];
  showAnswer: boolean;
  answer: string;
  explanation?: string;
  source?: string;
};

export function QuizQuestion({ 
  question, 
  questionType, 
  possibleAnswers, 
  showAnswer, 
  answer, 
  explanation, 
  source 
}: QuizQuestionProps) {
  const [answerUI, setAnswerUI] = useState<boolean>(false);
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState<string[] | string>(questionType === 'multiple-choice' ? [] : '');
  const [messages, setMessages] = useUIState<typeof AI>();
  const { submitAnswer } = useActions<typeof AI>();
  const isMultipleChoice = questionType === 'multiple-choice';

  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (isMultipleChoice) {
      setSelectedOption(prev => 
        Array.isArray(prev)
          ? prev.includes(value) ? prev.filter(option => option !== value) : [...prev, value]
          : [value]
      );
    } else {
      setSelectedOption(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isMultipleChoice && Array.isArray(selectedOption) && selectedOption.length === 0) {
      toast({
        title: "No option selected",
        description: "Please select at least one option.",
        action: <ToastAction altText="Okay">Okay</ToastAction>,
      });
      return;
    } else if (!isMultipleChoice && !selectedOption) {
      toast({
        title: "No option selected",
        description: "Please select an option.",
        action: <ToastAction altText="Okay">Okay</ToastAction>,
      });
      return;
    }
    // Add user message UI
    setMessages((currentMessages: Message[]) => [
      ...currentMessages,
      {
        id: Date.now(),
        display: <UserMessage>{`My answer is: "${selectedOption}"`}</UserMessage>,
      },
    ]);

    const response = await submitAnswer(selectedOption);
    setAnswerUI(response.answerUI)
    // Insert a new system message to the UI.
    setMessages((currentMessages: Message[]) => [
      ...currentMessages,
      response.newMessage,
    ]);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-4">
        <MemoizedReactMarkdown>
          {question}
        </MemoizedReactMarkdown>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {possibleAnswers.map((option, index) => (
            <label key={index} className="flex items-center">
              <input
                className={isMultipleChoice ? "form-checkbox h-5 w-5" : "form-radio h-5 w-5"}
                name={isMultipleChoice ? `option_${index}` : "quiz"}
                type={isMultipleChoice ? "checkbox" : "radio"}
                value={option}
                onChange={handleOptionChange}
                checked={isMultipleChoice 
                  ? Array.isArray(selectedOption) && selectedOption.includes(option)
                  : selectedOption === option}
              />
              <span className="ml-2 prose">
                <MemoizedReactMarkdown>
                  {option}
                </MemoizedReactMarkdown>
              </span>
            </label>
          ))}
        </div>
        <div className="mt-6">
          <button type="submit"
            disabled={answerUI}
            className="shadow-[0_4px_14px_0_rgb(0,118,255,39%)] hover:shadow-[0_6px_20px_rgba(0,118,255,23%)] hover:bg-[rgba(0,118,255,0.9)] px-8 py-2 bg-[#0070f3] rounded-md text-white font-light transition duration-200 ease-linear"
          >
            Submit Answer
          </button>
        </div>
      </form>
      {showAnswer && answerUI && (
        <div className="mt-4">
          <div className="mt-6">
            {explanation && (
              <p className="text-sm mt-1">{explanation}</p>
            )}
          </div>
          <div className="mt-4">
            {source && (
              <p className="text-sm mt-1">Source: <a href={source}>{source}</a></p>
            )}
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-semibold">Explanation</h3>
            <p>{`The correct answer is: "${answer}".`}</p>
          </div>
        </div>
      )}
    </div>
  );
}
