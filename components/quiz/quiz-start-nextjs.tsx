import { CardTitle, CardDescription, CardHeader, CardContent, Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useActions, useUIState } from "ai/rsc";
import { AI } from "@/app/action";
import { useState } from "react"
import { UserMessage } from "./message"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SelectGroup, SelectLabel } from "@radix-ui/react-select"

// Temporarily define subjects here
const subjects = {
  children: [
    { name: 'React', url: 'reactjs', children: [
      { name: 'Hooks', url: 'reactjs-hooks.mdx' },
      { name: 'Components', url: 'reactjs-components.mdx' }
    ] },
    { name: 'JavaScript', url: 'javascript', children: [
      { name: 'Basics', url: 'javascript-basics.mdx' },
      { name: 'Advanced', url: 'javascript-advanced.mdx' }
    ] },
  ]
};

export function QuizStart({ topics = "reactjs", numberOfQuestions = 3 }) {
  const [startQuizUI, setStartQuizUI] = useState<boolean>(false);
  const [topic, setTopic] = useState(topics);
  const [totalQuestions, setTotalQuestions] = useState(numberOfQuestions);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [, setMessages] = useUIState<typeof AI>();
  const { startQuiz } = useActions<typeof AI>();

  const hasMdxFiles = (items: any[]): boolean => {
    return items.some((item: any) => item.name.endsWith('.mdx') || (item.children && hasMdxFiles(item.children)));
  };

  const renderItems = (items: any[]) => {
    return items.flatMap((item: any) => {
      if (item.name.endsWith('.mdx')) {
        return (
          <SelectItem key={item.name} value={item.url}>
            {item.title || item.name}
          </SelectItem>
        );
      }
      else if (item.children && hasMdxFiles(item.children)) {
        return (
          <SelectGroup key={item.name}>
            <SelectLabel className="font-bold m-2">{item.name}</SelectLabel>
            {renderItems(item.children)}
          </SelectGroup>
        );
      }
      return [];
    });
  };

  return (
    <Card className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
          Start a Quiz
        </CardTitle>
        <CardDescription className="text-center text-gray-600 dark:text-gray-400">
          Select your preferred topics, set the number of questions, and choose whether to show the correct answers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="popoverTrigger">Topic</Label>
            <Select
              defaultValue={topic}
              onValueChange={(value) => {
                console.log('value', value)
                setTopic(value)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a topic" />
              </SelectTrigger>
              <SelectContent>
                {renderItems(subjects.children)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-gray-900 dark:text-gray-100" htmlFor="total-questions">
              Total Number of Questions
            </Label>
            <Input
              className="w-full bg-gray-100 dark:bg-gray-700 rounded-md"
              id="total-questions"
              max="50"
              min="1"
              type="number"
              value={totalQuestions}
              onChange={(e) => setTotalQuestions(parseInt(e.target.value, 10))}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              aria-label="Show correct answer"
              className="bg-gray-100 dark:bg-gray-700 rounded-md"
              checked={showCorrectAnswer}
              onCheckedChange={setShowCorrectAnswer}
              id="show-correct-answer"
            />
            <Label className="text-gray-900 dark:text-gray-100" htmlFor="show-correct-answer">
              Show Correct Answer
            </Label>
          </div>

          <Button
            className="ml-1 shadow-[0_4px_14px_0_rgb(0,118,255,39%)] hover:shadow-[0_6px_20px_rgba(0,118,255,23%)] hover:bg-[rgba(0,118,255,0.9)] px-8 py-2 bg-[#0070f3] rounded-md text-white font-light transition duration-200 ease-linear"
            disabled={startQuizUI}
            onClick={async (e) => {
              e.preventDefault();
              setMessages((currentMessages: any) => [
                ...currentMessages,
                {
                  id: Date.now(),
                  display: <UserMessage>
                    {`A quiz with ${totalQuestions} questions on the topic of ${topic}. ${showCorrectAnswer ? "I want see the correct answer after each question." : ""}`}
                  </UserMessage>,
                },
              ]);
              console.log('topics', topic, totalQuestions, showCorrectAnswer)
              const response = await startQuiz(topic, totalQuestions, showCorrectAnswer);
              setStartQuizUI(response.startQuizUI);
              setMessages((currentMessages: any) => [
                ...currentMessages,
                response.newMessage,
              ]);
            }}
          >
            Start Quiz
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
