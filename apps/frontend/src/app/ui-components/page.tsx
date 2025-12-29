'use client';

import Button from '@/components/ui/buttons/NewButton';
import Card from '@/components/ui/cards/Card';
import { WordCarousel } from '@/features/menu/components/WordCarousel';

export default function UiComponentsPage() {
  return (
    <section className="min-h-screen p-4 overflow-auto text-black">
      <div className="flex flex-col items-center gap-10 overflow-auto p-4">
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-2xl p-1">Buttons</h1>

          {/* Variants */}
          <div className="grid grid-rows-3 grid-cols-3 border border-gray-300">
            {/* Header */}
            <div className="grid place-items-center p-6 border border-gray-300"></div>
            <div className="grid place-items-center p-6 border border-gray-300">
              Default
            </div>
            <div className="grid place-items-center p-6 border border-gray-300">
              Disabled
            </div>

            {/* 1 row */}
            <div className="grid place-items-center p-6 border border-gray-300">
              Primary
            </div>
            <div className="grid place-items-center p-6 border border-gray-300">
              <Button variant="primary" size="md">
                LABEL
              </Button>
            </div>
            <div className="grid place-items-center p-6 border border-gray-300">
              <Button variant="primary" size="md" disabled={true}>
                LABEL
              </Button>
            </div>

            {/* 2 row */}
            <div className="grid place-items-center p-6 border border-gray-300">
              Secondary
            </div>
            <div className="grid place-items-center p-6 border border-gray-300">
              <Button variant="secondary" size="md">
                LABEL
              </Button>
            </div>
            <div className="grid place-items-center p-6 border border-gray-300">
              <Button variant="secondary" size="md" disabled={true}>
                LABEL
              </Button>
            </div>

            {/* 3 row */}
            <div className="grid place-items-center p-6 border border-gray-300">
              Accent
            </div>
            <div className="grid place-items-center p-6 border border-gray-300">
              <Button variant="accent" size="md">
                LABEL
              </Button>
            </div>
            <div className="grid place-items-center p-6 border border-gray-300">
              <Button variant="accent" size="md" disabled={true}>
                LABEL
              </Button>
            </div>
          </div>

          {/* Sizes */}
          <div className="grid grid-rows-2 grid-cols-3 border border-gray-300">
            <div className="grid place-items-center p-6 border border-gray-300">
              Small
            </div>
            <div className="grid place-items-center p-6 border border-gray-300">
              Medium
            </div>
            <div className="grid place-items-center p-6 border border-gray-300">
              Large
            </div>
            <div className="grid place-items-center p-6 border border-gray-300">
              <Button variant="primary" size="sm">
                LABEL
              </Button>
            </div>
            <div className="grid place-items-center p-6 border border-gray-300">
              <Button variant="primary" size="md">
                LABEL
              </Button>
            </div>
            <div className="grid place-items-center p-6 border border-gray-300">
              <Button variant="primary" size="lg">
                LABEL
              </Button>
            </div>
          </div>

          {/* Loading */}
          <div className="grid grid-rows-1 grid-cols-2">
            <div className="grid place-items-center p-6 border border-gray-300">
              Loading button
            </div>
            <div className="grid place-items-center p-6 border border-gray-300">
              <Button
                variant="primary"
                size="lg"
                onClick={async () => {
                  await new Promise((res) => setTimeout(res, 2000));
                  console.log('loader finished');
                }}
              >
                LABEL
              </Button>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-2xl p-1">Cards</h1>
          {/* Variants */}
          <div className="grid grid-rows-2 grid-cols-3 border border-gray-300">
            {/* Header */}
            <div className="grid place-items-center p-6 border border-gray-300">
              Primary
            </div>
            <div className="grid place-items-center p-6 border border-gray-300">
              Secondary
            </div>
            <div className="grid place-items-center p-6 border border-gray-300">
              Accent
            </div>

            {/* 1 row */}
            <div className="grid place-items-center p-6 border border-gray-300">
              <Card variant="primary" size="md">
                <p>
                  Test Card
                  <br />
                  Test Card
                  <br />
                  Test Card
                  <br />
                  Test Card
                </p>
              </Card>
            </div>
            <div className="grid place-items-center p-6 border border-gray-300">
              <Card variant="secondary" size="md">
                <p>
                  Test Card
                  <br />
                  Test Card
                  <br />
                  Test Card
                  <br />
                  Test Card
                </p>
              </Card>
            </div>
            <div className="grid place-items-center p-6 border border-gray-300">
              <Card variant="accent" size="md">
                <p>
                  Test Card
                  <br />
                  Test Card
                  <br />
                  Test Card
                  <br />
                  Test Card
                </p>
              </Card>
            </div>
          </div>

          {/* Sizes */}
          <div className="grid grid-rows-2 grid-cols-3 border border-gray-300">
            <div className="grid place-items-center p-3 border border-gray-300">
              Small
            </div>
            <div className="grid place-items-center p-3 border border-gray-300">
              Medium
            </div>
            <div className="grid place-items-center p-3 border border-gray-300">
              Large
            </div>
            <div className="grid place-items-center p-6 border border-gray-300">
              <Card size="sm">
                <p>
                  Test Card
                  <br />
                  Test Card
                  <br />
                  Test Card
                  <br />
                  Test Card
                </p>
              </Card>
            </div>
            <div className="grid place-items-center p-6 border border-gray-300">
              <Card size="md">
                <p>
                  Test Card
                  <br />
                  Test Card
                  <br />
                  Test Card
                  <br />
                  Test Card
                </p>
              </Card>
            </div>
            <div className="grid place-items-center p-6 border border-gray-300">
              <Card size="lg">
                <p>
                  Test Card
                  <br />
                  Test Card
                  <br />
                  Test Card
                  <br />
                  Test Card
                </p>
              </Card>
            </div>
          </div>
        </div>

        {/* Other components */}
        <h1 className="text-2xl p-1">Other components</h1>
        <WordCarousel />
      </div>
    </section>
  );
}
