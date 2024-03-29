import { Component } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Question } from '../shared/question';
import { QuestionService } from '../shared/question.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ResultService } from '../shared/result.service';

@Component({
  selector: 'llce-check',
  templateUrl: './check.component.html',
  styleUrls: ['./check.component.css'],
})
export class CheckComponent {
  question$: Observable<Question>;
  questions$: Observable<Question[]>;
  pageID: string;
  tempQuestionsLength$: Observable<number>;
  questionsLength: number = 0;
  correctAnswers: number = 0;
  wrongAnswers: number = 0;
  skippedAnswers: number = 0;
  answerRight: boolean = false;
  answerNotGiven: boolean = false;

  constructor(
    private rService: ResultService,
    private service: QuestionService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.pageID = this.route.snapshot.paramMap.get('id')!;
    this.question$ = this.service.getSingleQuestion(this.pageID);
    this.questions$ = this.service.getQuestions();

    this.tempQuestionsLength$ = this.service
      .getQuestions()
      .pipe(map((questions) => questions.length));

    this.tempQuestionsLength$.subscribe((length) => {
      this.questionsLength = length;
    });
  }
  endCheck() {
    this.updateScore(this.answerNotGiven, this.answerRight);
    this.setServiceValues()
    this.router.navigate(['/result']);
  }
  skipQuestion() {
    this.skippedAnswers++;
    this.pageID = this.route.snapshot.paramMap.get('id')!;
    const nextPage: number = parseInt(this.pageID) + 1;
    if (nextPage <= this.questionsLength && this.wrongAnswers < 8) {
      this.question$ = this.service.getSingleQuestion(nextPage.toString());
      this.router.navigate(['/check', nextPage]);
    } else {
      this.setServiceValues()
      this.router.navigate(['/result']);
    }
    this.answerRight = false;
    this.answerNotGiven = false;
  }
  submitAnswer() {
    this.pageID = this.route.snapshot.paramMap.get('id')!;
    const previousPage: number = parseInt(this.pageID) - 1;
    const nextPage: number = parseInt(this.pageID) + 1;
    if (this.answerRight) {
      this.updateScore(this.answerNotGiven, this.answerRight);
      if (nextPage <= this.questionsLength) {
        this.question$ = this.service.getSingleQuestion(nextPage.toString());
        this.router.navigate(['/check', nextPage]);
      } else {
        this.endCheck();
      }
    } else {
      this.updateScore(this.answerNotGiven, this.answerRight);
      if (this.wrongAnswers < 8) {
        if (previousPage >= 1) {
          console.log('prv', previousPage)
          this.question$ = this.service.getSingleQuestion(
            previousPage.toString()
          );
          this.router.navigate(['/check', previousPage]);
        } else {
          this.question$ = this.service.getSingleQuestion(
            parseInt(this.pageID).toString());
          this.router.navigate(['/check',  parseInt(this.pageID)]);
        }
      }
      else {
        this.setServiceValues()
         this.router.navigate(['/result']);
      }
    }
  }
  handleNoAnswerChange(noAnswer: boolean): void {
    this.answerNotGiven = noAnswer;
  }

  handleRightAnswerChange(rightAnswer: boolean): void {
    this.answerRight = rightAnswer;
  }
  updateScore(noAnswer: boolean, rightAnswer: boolean) {
    if (noAnswer || !rightAnswer) {
      this.wrongAnswers++;
    } else if (rightAnswer) {
      this.correctAnswers++;
    }
    this.answerNotGiven = false;
    this.answerRight = false;
  }
  setServiceValues(){
    this.rService.resetValues();
    this.rService.rightAnswers = this.correctAnswers;
    this.rService.wrongAnswers = this.wrongAnswers -1;
    this.rService.skippedAnswers = this.skippedAnswers;
    this.rService.showSkipped = true;
    this.rService.showPassed = false;
  }
}
