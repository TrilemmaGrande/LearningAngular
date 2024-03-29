import { Component } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Question } from '../shared/question';
import { QuestionService } from '../shared/question.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ResultService } from '../shared/result.service';

@Component({
  selector: 'llce-exam',
  templateUrl: './exam.component.html',
  styleUrls: ['./exam.component.css'],
})
export class ExamComponent {
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
  endExam() {
    let testPassed: boolean = false;
    this.updateScore(this.answerNotGiven, this.answerRight);
    if(this.correctAnswers >= this.questionsLength * 0.8){
      testPassed = true;
    }
    this.setServiceValues(testPassed)
    this.router.navigate(['/result']);
  }

  submitAnswer() {
    this.pageID = this.route.snapshot.paramMap.get('id')!;
    const previousPage: number = parseInt(this.pageID) - 1;
    const nextPage: number = parseInt(this.pageID) + 1;
    if (this.answerRight) {
      this.updateScore(this.answerNotGiven, this.answerRight);
      if (nextPage <= this.questionsLength) {
        this.question$ = this.service.getSingleQuestion(nextPage.toString());
        this.router.navigate(['/exam', nextPage]);
      } else {
        this.endExam();
      }
    } else {
      this.updateScore(this.answerNotGiven, this.answerRight);

      if (this.wrongAnswers > this.questionsLength * 0.2) {
        this.setServiceValues(false)
        setTimeout(() => {
          this.router.navigate(['/result']);
        }, 0);
      }
      if (nextPage <= this.questionsLength) {
        this.question$ = this.service.getSingleQuestion(nextPage.toString());
        this.router.navigate(['/exam', nextPage]);
      } else {
        this.endExam();
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
  setServiceValues(passed: boolean){
    this.rService.resetValues();
    this.rService.rightAnswers = this.correctAnswers;
    this.rService.wrongAnswers = this.wrongAnswers -1;
    this.rService.showSkipped = false;
    this.rService.showPassed = true;
    this.rService.testPassed = passed;
  }
}
